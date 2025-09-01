import { info } from "console";
import pool from "../config/db";
import { statObject } from "../dto";
import { verify } from "crypto";

export class User {
  public id?: number;
  public username: string;
  public email: string;
  public password: string;
  public avatar?: string;
  public description?: string;
  public cover?: string;
  public admin?: boolean;
  public type: string;
  public verify: boolean;

  constructor(
    username: string,
    email: string,
    password: string,
    type: string,
    avatar?: string,
    cover?: string,
    description?: string,
    id?: number,
    admin?: boolean,
    verify: boolean = false
  ) {
    this.id = id;
    this.username = username;
    this.email = email;
    this.password = password;
    this.avatar = avatar;
    this.cover = cover;
    (this.description = description || ""), (this.admin = admin);
    this.verify = verify;
    this.type = type;
  }

  static async findOne(
    id?: number,
    email?: string,
    username?: string
  ): Promise<User | null> {
    const conditions: string[] = [];
    const params: (string | number)[] = [];

    if (id !== undefined) {
      conditions.push("id = ?");
      params.push(id);
    }
    if (email !== undefined) {
      conditions.push("email = ?");
      params.push(email);
    }
    if (username !== undefined) {
      conditions.push("username = ?");
      params.push(username);
    }

    if (conditions.length === 0) {
      return null;
    }

    const query = `SELECT * FROM users WHERE ${conditions.join(
      " OR "
    )} LIMIT 1`;
    const [rows] = (await pool.query(query, params)) as any[];

    if (rows.length === 0) {
      return null;
    }

    const user = rows[0];
    console.log("User found:", user);
    return new User(
      user.username,
      user.email,
      user.password,
      user.type,
      user.avatar,
      user.cover,
      user.description,
      user.id,
      user.admin,
      user.verified
    );
  }

  static async findAll(): Promise<User[]> {
    const [rows]: any = await pool.query("SELECT * FROM users");
    return rows.map(
      (user: any) =>
        new User(
          user.username,
          user.email,
          user.password,
          user.type,
          user.avatar,
          user.cover,
          user.description,
          user.id,
          user.admin,
          user.verified
        )
    );
  }

  static async create(
    name: string,
    email: string,
    password: string,
    type: string,
    avatar?: string,
    cover?: string
  ): Promise<User> {
    const [result]: any = await pool.query(
      "INSERT INTO users ( username, email, password, avatar, cover, admin, type) VALUES (?, ?, ?, ?, ?, 0, ?)",
      [name, email, password, avatar, cover, type]
    );
    const userId = result.insertId;
    return new User(
      name,
      email,
      password,
      type,
      avatar,
      cover,
      undefined,
      userId
    );
  }

  async toggleSetAdmin() {
    if (!this.id) {
      throw new Error(
        "Cannot save admin status without ID. Use User.create() for new users."
      );
    }

    // Toggle admin status
    this.admin = !this.admin;

    const [result] = await pool.query(
      "UPDATE users SET admin = ? WHERE id = ?",
      [this.admin, this.id]
    );
    return result;
  }

  async save(): Promise<any> {
    if (!this.id) {
      throw new Error(
        "Cannot save user without ID. Use User.create() for new users."
      );
    }

    const [result] = await pool.query(
      "UPDATE users SET username = ?, email = ?, password = ?, avatar = ?, cover = ?, description = ? WHERE id = ?",
      [
        this.username,
        this.email,
        this.password,
        this.avatar || "",
        this.cover || "",
        this.description || "",
        this.id,
      ]
    );
    return result;
  }

  async getAllUserHasFollowed(): Promise<User[]> {
    const query = `
      SELECT u.*
      FROM users u
      INNER JOIN follow f ON u.id = f.followedUserId
      WHERE f.userId = ?
    `;
    const [rows]: any = await pool.query(query, [this.id]);
    return rows.map(
      (user: any) =>
        new User(
          user.username,
          user.email,
          user.password,
          user.type,
          user.avatar,
          user.cover,
          user.description,
          user.id,
          user.admin,
          user.verified
        )
    );
  }

  async checkUserFollowed(id: number): Promise<boolean> {
    const query = `
      SELECT 1
      FROM follow
      WHERE userId = ? AND followedUserId = ?
    `;
    const [rows]: any = await pool.query(query, [this.id, id]);
    console.log(this.id, id, rows);
    return rows.length > 0;
  }

  async followUser(followedId: number) {
    // --- FIX ---
    // Add a check to ensure the user is not trying to follow themselves.
    // 'this.id' refers to the ID of the user performing the action.
    if (this.id === followedId) {
      // By throwing an error here, we stop execution before hitting the database
      // and can send a clear error message back to the client.
      console.log(this.id, followedId);
      throw new Error("You cannot follow yourself.");
    }

    const query = `
    INSERT INTO follow (userId, followedUserId)
    VALUES (?, ?)
  `;

    // The query only runs if the IDs are different.
    const [result]: any = await pool.query(query, [this.id, followedId]);
    return result;
  }

  async unfollowUser(followedId: number) {
    // Correct SQL syntax for deleting a specific row.
    const query = `
    DELETE FROM follow 
    WHERE userId = ? AND followedUserId = ?
  `;

    // The parameters [this.id, followedId] correctly match the placeholders.
    const [result]: any = await pool.query(query, [this.id, followedId]);
    return result;
  }

  static async userStats(
    username?: string
  ): Promise<statObject | statObject[]> {
    let query = `SELECT
    u.id AS user_id,
    u.username,
    COUNT(DISTINCT followers.id) AS follower_count,
    COUNT(DISTINCT following.id) AS following_count,
    COUNT(DISTINCT p.id) AS post_count
FROM
    users u
LEFT JOIN
    follow AS followers ON u.id = followers.followedUserId
LEFT JOIN
    follow AS following ON u.id = following.userId
LEFT JOIN
    posts AS p ON u.id = p.ownerId`;

    const params: any[] = [];

    if (username) {
      query += ` WHERE u.username = ?`;
      params.push(username);
    }

    query += ` GROUP BY u.id, u.username ORDER BY u.id`;

    const [rows]: any = await pool.query(query, params);

    if (username) {
      if (rows.length === 0) {
        throw new Error("User not found");
      }
      return rows[0];
    }

    return rows;
  }
}

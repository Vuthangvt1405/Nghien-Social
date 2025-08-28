import pool from "../config/db";
import slugify from "slugify";

export class Post {
  constructor(
    public id: number,
    public ownerId: number,
    public title: string,
    public caption: string,
    public content: string,
    public slug: string,
    public cover: string,
    public isLocked: boolean = false,
    public createdAt: Date = new Date(),
    public updatedAt: Date = new Date(),
    public owner: string,
    public email: string,
    public avatar: string,
    public admin: boolean,
    public total_likes: number,
    public total_dislikes: number
  ) {
    this.id = id;
    this.ownerId = ownerId;
    this.title = title;
    this.caption = caption;
    this.content = content;
    this.slug = slug;
    this.cover = cover;
    this.isLocked = isLocked;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.owner = owner;
    this.email = email;
    this.avatar = avatar;
    this.admin = admin;
    this.total_likes = total_likes;
    this.total_dislikes = total_dislikes;
  }

  static async create(
    ownerId: number,
    title: string,
    caption: string,
    content: string,
    cover: string,
    slug: string
  ): Promise<Post> {
    // Simulate database creation logic
    let sql = `INSERT INTO posts (ownerId, title, caption, content, slug, cover, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

    let values = [
      ownerId,
      title,
      caption,
      content,
      slug,
      cover,
      new Date(),
      new Date(),
    ];

    const [result]: any[] = await pool.query(sql, values);

    // Here you would typically save the post to the database
    return result;
  }

  static async findById(id: number): Promise<Post> {
    const sql = "SELECT * FROM posts WHERE id = ?";
    const [rows]: any[] = await pool.query(sql, [id]);
    if (rows.length === 0) {
      throw new Error("Post not found");
    }
    return new Post(
      rows[0].id,
      rows[0].ownerId,
      rows[0].title,
      rows[0].caption,
      rows[0].content,
      rows[0].slug,
      rows[0].cover,
      rows[0].isLocked,
      rows[0].created_at,
      rows[0].updated_at,
      rows[0].owner,
      rows[0].email,
      rows[0].avatar,
      rows[0].admin,
      rows[0].total_like,
      rows[0].total_dislike
    );
  }

  static async isUserReactThisPost(postId: number, userId: number) {
    const sql = `SELECT reaction FROM post_reactions where post_id = ? and user_id = ?`;
    const values = [postId, userId];
    const [rows]: any = await pool.query(sql, values);
    if (rows && rows.length > 0) {
      return rows[0]["reaction"];
    } else {
      return null;
    }
  }

  static async findBySlug(slug: string) {
    const sql = `SELECT 
    p.id, 
    p.ownerId, 
    p.title, 
    p.caption, 
    p.content, 
    p.slug,
    p.cover, 
    p.isLocked, 
    p.created_at, 
    p.updated_at,
    u.username as owner, 
    u.email, 
    u.avatar, 
    u.admin,
    COUNT(CASE WHEN pr.reaction = 1 THEN 1 END) as total_likes,
    COUNT(CASE WHEN pr.reaction = 0 THEN 1 END) as total_dislikes
FROM posts p
JOIN users u ON p.ownerId = u.id
LEFT JOIN post_reactions pr ON pr.post_id = p.id
where slug like ?
GROUP BY 
    p.id, p.ownerId, p.title, p.caption, p.content, p.slug, p.cover, p.isLocked, 
    p.created_at, p.updated_at, u.username, u.email, u.avatar, u.admin
ORDER BY p.created_at DESC;
`;
    const [rows]: any[] = await pool.execute(sql, [`%${slug}%`]);
    if (rows.length === 0) {
      throw new Error("Post not found");
    }
    return rows;
  }

  static async findOnePostBySlug(slug: string) {
    const sql = `SELECT 
    p.id, 
    p.ownerId, 
    p.title, 
    p.caption, 
    p.content, 
    p.slug,
    p.cover, 
    p.isLocked, 
    p.created_at, 
    p.updated_at,
    u.username as owner, 
    u.email, 
    u.avatar, 
    u.admin,
    COUNT(CASE WHEN pr.reaction = 1 THEN 1 END) as total_likes,
    COUNT(CASE WHEN pr.reaction = 0 THEN 1 END) as total_dislikes
FROM posts p
JOIN users u ON p.ownerId = u.id
LEFT JOIN post_reactions pr ON pr.post_id = p.id
where slug = ?
GROUP BY 
    p.id, p.ownerId, p.title, p.caption, p.content, p.slug, p.cover, p.isLocked, 
    p.created_at, p.updated_at, u.username, u.email, u.avatar, u.admin
ORDER BY p.created_at DESC;
`;
    const [rows]: any[] = await pool.execute(sql, [`${slug}`]);
    if (rows.length === 0) {
      throw new Error("Post not found");
    }
    return rows[0];
  }

  static async getPostUser(username: string) {
    const sql = `SELECT * FROM posts WHERE ownerId = (SELECT id FROM users WHERE username = ?)`;
    const [rows]: any[] = await pool.execute(sql, [username]);
    if (rows.length === 0) {
      throw new Error("No posts found for this user");
    }
    return rows;
  }

  static async getAllPostAndReactionByUser(userId: number) {
    const sql = `SELECT 
    p.id, 
    p.ownerId, 
    p.title, 
    p.caption, 
    p.content, 
    p.slug,
    p.cover, 
    p.isLocked, 
    p.created_at, 
    p.updated_at,
    u.username as owner, 
    u.email,
    u.avatar, 
    u.admin,
    COUNT(CASE WHEN pr_all.reaction = 1 THEN 1 END) as total_likes,
    COUNT(CASE WHEN pr_all.reaction = 0 THEN 1 END) as total_dislikes,
    -- Reaction của user hiện tại cho bài post này
    MAX(CASE WHEN pr_user.user_id = ? THEN pr_user.reaction END) as user_reaction,
    -- Thời gian user react (nếu có)
    MAX(CASE WHEN pr_user.user_id = ? THEN pr_user.created_at END) as user_reaction_time,
    -- JSON format của reaction user hiện tại
    CASE 
        WHEN MAX(pr_user.reaction) IS NOT NULL 
        THEN JSON_OBJECT(
            'user_id', ?,
            'reaction', MAX(pr_user.reaction),
            'created_at', MAX(pr_user.created_at)
        )
        ELSE NULL 
    END as current_user_reaction_json
FROM posts p
JOIN users u ON p.ownerId = u.id
LEFT JOIN post_reactions pr_all ON pr_all.post_id = p.id  -- Tất cả reactions để đếm
LEFT JOIN post_reactions pr_user ON pr_user.post_id = p.id AND pr_user.user_id = ?  -- Chỉ reaction của user hiện tại
GROUP BY 
    p.id, p.ownerId, p.title, p.caption, p.content, p.slug, p.cover, p.isLocked, 
    p.created_at, p.updated_at, u.username, u.email, u.avatar, u.admin
ORDER BY p.created_at DESC;
`;

    const values = [userId, userId, userId, userId];
    const [result] = await pool.execute(sql, values);
    return result;
  }

  static async getPostsByUsernameAndReactionByUser(
    username: string,
    userId: number
  ) {
    const sql = `SELECT 
    p.id, 
    p.ownerId, 
    p.title, 
    p.caption, 
    p.content, 
    p.slug,
    p.cover, 
    p.isLocked, 
    p.created_at, 
    p.updated_at,
    u.username as owner, 
    u.email,
    u.avatar, 
    u.admin,
    COUNT(CASE WHEN pr_all.reaction = 1 THEN 1 END) as total_likes,
    COUNT(CASE WHEN pr_all.reaction = 0 THEN 1 END) as total_dislikes,
    -- Reaction của user hiện tại cho bài post này
    MAX(CASE WHEN pr_user.user_id = ? THEN pr_user.reaction END) as user_reaction,
    -- Thời gian user react (nếu có)
    MAX(CASE WHEN pr_user.user_id = ? THEN pr_user.created_at END) as user_reaction_time,
    -- JSON format của reaction user hiện tại
    CASE 
        WHEN MAX(pr_user.reaction) IS NOT NULL 
        THEN JSON_OBJECT(
            'user_id', ?,
            'reaction', MAX(pr_user.reaction),
            'created_at', MAX(pr_user.created_at)
        )
        ELSE NULL 
    END as current_user_reaction_json
FROM posts p
JOIN users u ON p.ownerId = u.id
LEFT JOIN post_reactions pr_all ON pr_all.post_id = p.id  -- Tất cả reactions để đếm
LEFT JOIN post_reactions pr_user ON pr_user.post_id = p.id AND pr_user.user_id = ?  -- Chỉ reaction của user hiện tại
WHERE u.username = ?
GROUP BY 
    p.id, p.ownerId, p.title, p.caption, p.content, p.slug, p.cover, p.isLocked, 
    p.created_at, p.updated_at, u.username, u.email, u.avatar, u.admin
ORDER BY p.created_at DESC;
`;

    const values = [userId, userId, userId, userId, username];
    const [result] = await pool.execute(sql, values);
    return result;
  }

  static async getPostAndReaction(postId: number, userId: number) {
    const sql = `SELECT 
    p.id, 
    p.ownerId, 
    p.title, 
    p.caption, 
    p.content, 
    p.slug,
    p.cover, 
    p.isLocked, 
    p.created_at, 
    p.updated_at,
    u.username as owner, 
    u.email,
    u.avatar, 
    u.admin,
    COUNT(CASE WHEN pr_all.reaction = 1 THEN 1 END) as total_likes,
    COUNT(CASE WHEN pr_all.reaction = 0 THEN 1 END) as total_dislikes,
    MAX(CASE WHEN pr_user.user_id = ? THEN pr_user.reaction END) as user_reaction
FROM posts p
JOIN users u ON p.ownerId = u.id
LEFT JOIN post_reactions pr_all ON pr_all.post_id = p.id
LEFT JOIN post_reactions pr_user ON pr_user.post_id = p.id AND pr_user.user_id = ?
WHERE p.id = ?
GROUP BY 
    p.id, p.ownerId, p.title, p.caption, p.content, p.slug, p.cover, p.isLocked, 
    p.created_at, p.updated_at, u.username, u.email, u.avatar, u.admin;
`;

    const values = [userId, userId, postId];
    const [rows]: any[] = await pool.execute(sql, values);
    if (rows.length === 0) {
      throw new Error("Post not found");
    }
    return rows[0];
  }

  static findAll = async (): Promise<Post[]> => {
    // Simulate database retrieval logic
    let sql = `SELECT 
    p.id, 
    p.ownerId, 
    p.title, 
    p.caption, 
    p.content, 
    p.slug,
    p.cover, 
    p.isLocked, 
    p.created_at, 
    p.updated_at,
    u.username as owner, 
    u.email, 
    u.avatar, 
    u.admin,
    COUNT(CASE WHEN pr.reaction = 1 THEN 1 END) as total_likes,
    COUNT(CASE WHEN pr.reaction = 0 THEN 1 END) as total_dislikes
FROM posts p
JOIN users u ON p.ownerId = u.id
LEFT JOIN post_reactions pr ON pr.post_id = p.id
GROUP BY 
    p.id, p.ownerId, p.title, p.caption, p.content, p.slug, p.cover, p.isLocked, 
    p.created_at, p.updated_at, u.username, u.email, u.avatar, u.admin
ORDER BY p.created_at DESC;
`;
    const [rows]: any[] = await pool.query(sql);

    // Here you would typically retrieve all posts from the database
    return rows.map(
      (row: any) =>
        new Post(
          row.id,
          row.ownerId,
          row.title,
          row.caption,
          row.content,
          row.slug,
          row.cover,
          row.isLocked,
          row.created_at,
          row.updated_at,
          row.owner,
          row.email,
          row.avatar,
          row.admin,
          row.total_likes,
          row.total_dislikes
        )
    );
  };

  async updatePostInfo(
    postId: number,
    updatedData: Partial<any>
  ): Promise<any> {
    const validFields = Object.keys(updatedData).filter(
      ([key, value]) => value !== undefined && value !== null
    );

    if (validFields.length === 0) {
      throw new Error("No valid fields to update");
    }

    // Simulate database update logic
    let sql = `UPDATE posts SET ${validFields
      .map((field) => `${field} = ?`)
      .join(", ")} WHERE id = ?`;
    let values = [...validFields.map((field) => updatedData[field]), postId];

    const [result]: any[] = await pool.query(sql, values);

    return result;
  }

  async likePost(userId: number, postId: number) {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // Kiểm tra trạng thái reaction hiện tại (tất cả reaction)
      const checkSql =
        "SELECT id, reaction FROM post_reactions WHERE user_id = ? AND post_id = ?";
      const [existingReactionRows]: any[] = await connection.execute(checkSql, [
        userId,
        postId,
      ]);

      let result: any;
      let action: "liked" | "unliked";

      if (existingReactionRows.length > 0) {
        const currentReaction = existingReactionRows[0].reaction;

        if (currentReaction === 1) {
          // Đã like -> Unlike (xóa reaction)
          const deleteSql =
            "DELETE FROM post_reactions WHERE user_id = ? AND post_id = ?";
          const [deleteResult]: any = await connection.execute(deleteSql, [
            userId,
            postId,
          ]);
          result = deleteResult;
          action = "unliked";
        } else {
          // Đã dislike -> Chuyển thành like (update reaction)
          const updateSql =
            "UPDATE post_reactions SET reaction = 1 WHERE user_id = ? AND post_id = ?";
          const [updateResult]: any = await connection.execute(updateSql, [
            userId,
            postId,
          ]);
          result = updateResult;
          action = "liked";
        }
      } else {
        // Chưa có reaction -> Like (insert mới)
        const insertSql =
          "INSERT INTO post_reactions (user_id, post_id, reaction) VALUES (?, ?, 1)";
        const [insertResult]: any = await connection.execute(insertSql, [
          userId,
          postId,
        ]);
        result = insertResult;
        action = "liked";
      }

      await connection.commit();

      return {
        success: true,
        action,
        affectedRows: result.affectedRows,
        insertId: result.insertId ?? null,
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async dislikePost(userId: number, postId: number) {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // Kiểm tra trạng thái reaction hiện tại (tất cả reaction)
      const checkSql =
        "SELECT id, reaction FROM post_reactions WHERE user_id = ? AND post_id = ?";
      const [existingReactionRows]: any[] = await connection.execute(checkSql, [
        userId,
        postId,
      ]);

      let result: any;
      let action: "disliked" | "undisliked";

      if (existingReactionRows.length > 0) {
        const currentReaction = existingReactionRows[0].reaction;

        if (currentReaction === 0) {
          // Đã dislike -> Undislike (xóa reaction)
          const deleteSql =
            "DELETE FROM post_reactions WHERE user_id = ? AND post_id = ?";
          const [deleteResult]: any = await connection.execute(deleteSql, [
            userId,
            postId,
          ]);
          result = deleteResult;
          action = "undisliked";
        } else {
          // Đã like -> Chuyển thành dislike (update reaction)
          const updateSql =
            "UPDATE post_reactions SET reaction = 0 WHERE user_id = ? AND post_id = ?";
          const [updateResult]: any = await connection.execute(updateSql, [
            userId,
            postId,
          ]);
          result = updateResult;
          action = "disliked";
        }
      } else {
        // Chưa có reaction -> Dislike (insert mới)
        const insertSql =
          "INSERT INTO post_reactions (user_id, post_id, reaction) VALUES (?, ?, 0)";
        const [insertResult]: any = await connection.execute(insertSql, [
          userId,
          postId,
        ]);
        result = insertResult;
        action = "disliked";
      }

      await connection.commit();

      return {
        success: true,
        action,
        affectedRows: result.affectedRows,
        insertId: result.insertId ?? null,
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}

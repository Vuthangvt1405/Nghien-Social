import pool from "../config/db";
import { comment } from "../dto/Comment.dto";

export class Comment {
  public id?: number;
  public content: string;
  public parentComment_id: number | null;
  public post_id: number;
  public user_id: number;
  public createdAt: Date;
  public updatedAt: Date;

  constructor(
    content: string,
    parentComment_id: number | null,
    post_id: number,
    user_id: number,
    createdAt: Date,
    updatedAt: Date,
    id?: number
  ) {
    this.id = id;
    this.content = content;
    this.parentComment_id = parentComment_id;
    this.post_id = post_id;
    this.user_id = user_id;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  static findAll = async (): Promise<comment[]> => {
    const sql = "SELECT * FROM comments";
    const [rows]: any[] = await pool.query(sql);
    return rows.map(
      (row: any) =>
        new Comment(
          row.content,
          row.parentComment_id,
          row.post_id,
          row.user_id,
          row.created_at,
          row.updated_at,
          row.id
        )
    );
  };

  static findById = async (id: number): Promise<Comment> => {
    const sql = "SELECT * FROM comments WHERE id = ?";
    const [rows]: any[] = await pool.query(sql, [id]);
    return rows[0];
  };

  static create = async (
    postId: number | null,
    userId: number,
    payload: any
  ) => {
    const sql = `INSERT INTO comments (content, parentComment_id, post_id, user_id, created_at, updated_at)
                 VALUES (?, ?, ?, ?, ?, ?)`;
    if (!postId) {
      postId = null;
    }
    if (!payload.parentComment_id) payload.parentComment_id = null;
    const values = [
      payload.content,
      payload.parentComment_id,
      postId,
      userId,
      new Date(),
      new Date(),
    ];
    const [result]: any[] = await pool.query(sql, values);

    // Save the comment to the database
    return result;
  };

  static update = async (
    id: number,
    content: Partial<Comment>
  ): Promise<Comment> => {
    const dynamicFields: string[] = [];
    const dynamicValues: any[] = [];

    if (content) {
      dynamicFields.push("content = ?");
      dynamicValues.push(content);
    }

    const sql = `UPDATE comments SET ${dynamicFields.join(
      ", "
    )}, updated_at = ? WHERE id = ?`;
    const values = [...dynamicValues, new Date(), id];
    const [result]: any[] = await pool.query(sql, values);
    return result;
  };

  static findCommentByPostId = async (postId: number) => {
    const sql = `SELECT 
    c.id,
    c.content,
    c.parentComment_id,
    c.post_id,
    c.created_at,
    c.updated_at,
    
    -- User info (giữ tên gốc)
    u.id as user_id,
    u.username,
    u.email,
    u.avatar,
    u.cover,
    u.admin,
    
    -- Reactions aggregated (nhóm lại)
    COUNT(cr.id) as reaction_count,
    SUM(CASE WHEN cr.reaction = 1 THEN 1 ELSE 0 END) as likes,
    SUM(CASE WHEN cr.reaction = 0 THEN 1 ELSE 0 END) as dislikes,
    
    -- JSON object cho reactions detail
    JSON_ARRAYAGG(
        CASE WHEN cr.id IS NOT NULL THEN
            JSON_OBJECT(
                'id', cr.id,
                'reaction', cr.reaction,
                'created_at', cr.created_at,
                'user', JSON_OBJECT(
                    'id', ur.id,
                    'name', ur.username,
                    'avatar', ur.avatar
                )
            )
        END
    ) as reactions
    
FROM comments c
INNER JOIN users u ON c.user_id = u.id
LEFT JOIN comment_reactions cr ON c.id = cr.commentId
LEFT JOIN users ur ON cr.userId = ur.id

WHERE c.post_id = ?

GROUP BY c.id, c.content, c.parentComment_id, c.post_id, c.created_at, c.updated_at,
         u.id, u.username, u.email, u.avatar, u.cover, u.admin

ORDER BY c.created_at DESC;
`;
    const values = [postId];
    const [result] = await pool.query(sql, values);
    return result;
  };

  static deleteById = async (id: number) => {
    const sql = "DELETE FROM comments WHERE id = ?";
    const result = await pool.query(sql, [id]);
    return result[0];
  };

  static hasUserLikedComment = async (commentId: number, userId: number) => {
    const sql =
      "SELECT * FROM comment_likes WHERE comment_id = ? AND user_id = ?";
    const values = [commentId];
    const [rows]: any[] = await pool.query(sql, values);
    return rows.length > 0;
  };

  static async likeComment(userId: number, commentId: number) {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // Lấy postId từ comment
      const getPostSql = "SELECT post_id FROM comments WHERE id = ?";
      const [commentRows]: any[] = await connection.execute(getPostSql, [
        commentId,
      ]);

      if (commentRows.length === 0) {
        throw new Error("Comment not found");
      }

      const postId = commentRows[0].post_id;

      // Kiểm tra trạng thái reaction hiện tại (tất cả reaction)
      const checkSql =
        "SELECT id, reaction FROM comment_reactions WHERE userId = ? AND commentId = ?";
      const [existingReactionRows]: any[] = await connection.execute(checkSql, [
        userId,
        commentId,
      ]);

      let result: any;
      let action: "liked" | "unliked";

      if (existingReactionRows.length > 0) {
        const currentReaction = existingReactionRows[0].reaction;

        if (currentReaction === 1) {
          // Đã like -> Unlike (xóa reaction)
          const deleteSql =
            "DELETE FROM comment_reactions WHERE userId = ? AND commentId = ?";
          const [deleteResult]: any = await connection.execute(deleteSql, [
            userId,
            commentId,
          ]);
          result = deleteResult;
          action = "unliked";
        } else {
          // Đã dislike -> Chuyển thành like (update reaction)
          const updateSql =
            "UPDATE comment_reactions SET reaction = 1, updated_at = CURRENT_TIMESTAMP WHERE userId = ? AND commentId = ?";
          const [updateResult]: any = await connection.execute(updateSql, [
            userId,
            commentId,
          ]);
          result = updateResult;
          action = "liked";
        }
      } else {
        // Chưa có reaction -> Like (insert mới)
        const insertSql =
          "INSERT INTO comment_reactions (userId, commentId, postId, reaction) VALUES (?, ?, ?, 1)";
        const [insertResult]: any = await connection.execute(insertSql, [
          userId,
          commentId,
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

  static async dislikeComment(userId: number, commentId: number) {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // Lấy postId từ comment
      const getPostSql = "SELECT post_id FROM comments WHERE id = ?";
      const [commentRows]: any[] = await connection.execute(getPostSql, [
        commentId,
      ]);

      if (commentRows.length === 0) {
        throw new Error("Comment not found");
      }

      const postId = commentRows[0].post_id;

      // Kiểm tra trạng thái reaction hiện tại (tất cả reaction)
      const checkSql =
        "SELECT id, reaction FROM comment_reactions WHERE userId = ? AND commentId = ?";
      const [existingReactionRows]: any[] = await connection.execute(checkSql, [
        userId,
        commentId,
      ]);

      let result: any;
      let action: "disliked" | "undisliked";

      if (existingReactionRows.length > 0) {
        const currentReaction = existingReactionRows[0].reaction;

        if (currentReaction === 0) {
          // Đã dislike -> Undislike (xóa reaction)
          const deleteSql =
            "DELETE FROM comment_reactions WHERE userId = ? AND commentId = ?";
          const [deleteResult]: any = await connection.execute(deleteSql, [
            userId,
            commentId,
          ]);
          result = deleteResult;
          action = "undisliked";
        } else {
          // Đã like -> Chuyển thành dislike (update reaction)
          const updateSql =
            "UPDATE comment_reactions SET reaction = 0, updated_at = CURRENT_TIMESTAMP WHERE userId = ? AND commentId = ?";
          const [updateResult]: any = await connection.execute(updateSql, [
            userId,
            commentId,
          ]);
          result = updateResult;
          action = "disliked";
        }
      } else {
        // Chưa có reaction -> Dislike (insert mới)
        const insertSql =
          "INSERT INTO comment_reactions (userId, commentId, postId, reaction) VALUES (?, ?, ?, 0)";
        const [insertResult]: any = await connection.execute(insertSql, [
          userId,
          commentId,
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

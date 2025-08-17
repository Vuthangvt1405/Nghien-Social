export const buildCommentTree = (
  flatComments,
  parentId: number | null = null
) => {
  return flatComments
    .filter((comment) => comment.parentComment_id === parentId)
    .map((comment) => ({
      ...comment,
      replies: buildCommentTree(flatComments, comment.id),
    }))
    .filter(
      (comment) =>
        comment.replies.length > 0 || comment.parentComment_id === parentId
    );
};

import { Request, Response, NextFunction } from "express";

export const paginationMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 10;

  const maxLimit = 100;
  const finalLimit = Math.min(pageSize, maxLimit);

  const offset = (page - 1) * finalLimit;

  req.pagination = {
    currentPage: page,
    pageSize: finalLimit,
    offset,
  };

  next();
};

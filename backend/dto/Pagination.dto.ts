import express from "express";

interface PaginationInfo {
  currentPage: string | number;
  pageSize: string | number;
  offset: string | number;
}

declare global {
  namespace Express {
    export interface Request {
      pagination?: PaginationInfo;
    }
  }
}

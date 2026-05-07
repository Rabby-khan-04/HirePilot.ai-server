import { Response } from "express";

type TResponse<T> = {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
};

const AppResponse = <T>(res: Response, data: TResponse<T>) => {
  return res.status(data.statusCode).json({
    success: data.success,
    message: data.message,
    data: data.data,
  });
};

export default AppResponse;

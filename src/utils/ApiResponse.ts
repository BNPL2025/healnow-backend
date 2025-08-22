class ApiResponse<T = any> {
  public statusCode: number;
  public data: T;
  public message: string;
  public success: boolean;
  public errors?: string[];

  constructor(
    statusCode: number, 
    data: T, 
    message: string = "Success",
    errors?: string[]
  ) {
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
    this.success = statusCode < 400;
    if (errors && errors.length > 0) {
      this.errors = errors;
    }
  }
}

export { ApiResponse };
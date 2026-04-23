export class AppError extends Error {
    constructor(
        public message: string,
        public statusCode: number
    ){
        super(message);
    }
}

export class NotFoundError extends AppError {
    constructor(message= "Resource not found"){
        super(message, 404)
    }
}

export class UnauthorizedError extends AppError {
    constructor(message="Unauthorized"){
        super(message, 401)
    }
}

export class BadRequestError extends AppError {
    constructor(message="Bad Request"){
        super(message, 400)
    }
}

export class InternalServerError extends AppError {
    constructor(message="Internal Server Error"){
        super(message, 500)
    }
}

export class ConflictError extends AppError {
    constructor(message="Conflict"){
        super(message, 409)
    }
}

export class ForbiddenError extends AppError {
    constructor(message="Forbidden"){
        super(message, 403)
    }
}

export class ValidationError extends AppError {
    constructor(message="Validation Error"){
        super(message, 422)
    }
}
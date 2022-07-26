import { NextFunction, Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import { BaseController } from '../common/base.controller';
import { HTTPError } from '../errors/http-error.class';
import { ILogger } from '../logger/logger.interface';
import { TYPES } from '../types';
import 'reflect-metadata';
import { IUserController } from './users.controller.interface';
import { UserLoginDto } from './dto/user-login.dto';
import { UserRegisterDto } from './dto/user-register.dto';
import { User } from './user.entity';
import { UserService } from './users.service';
import { ValidateMiddleware } from '../common/validate.middleware';

@injectable()
export class UserController extends BaseController implements IUserController {
  constructor(
    @inject(TYPES.ILogger) private loggerService: ILogger,
    @inject(TYPES.UserService) private userService: UserService,
  ) {
    super(loggerService);

    // вызвать bindRoutes
    this.bindRoutes([
      {
        path: '/register',
        method: 'post',
        func: this.register,
        middlewares: [new ValidateMiddleware(UserRegisterDto)], // валидация параметров
      },
      {
        path: '/login',
        method: 'post',
        func: this.login,
        middlewares: [new ValidateMiddleware(UserLoginDto)],
      },
    ]);
  }

  async login({ body }: Request<{}, {}, UserLoginDto>, res: Response, next: NextFunction): Promise<void> {
    this.loggerService.log(`[UsersController] login: ${body.email} - ${body.password}`);
    const result = await this.userService.validateUser(body);
    if (!result) {
      return next(new HTTPError(401, 'ошибка авторизации', 'login'));
    }
    this.ok(res, {}); // todo: возвращать JWT-токен
  }

  async register({ body }: Request<{}, {}, UserRegisterDto>, res: Response, next: NextFunction): Promise<void> {
    console.log(body);
    const result = await this.userService.createUser(body); // бизнес-логика
    if (!result) {
      return next(new HTTPError(422, 'Такой пользователь уже существует'));
    }
    const { email, id } = result;
    this.ok(res, { email, id });
  }
}

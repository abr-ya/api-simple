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
import { ValidateMiddleware } from '../common/validate.middleware';
import { sign, SignOptions } from 'jsonwebtoken';
import { IUserService } from './users.service.interface';
import { IConfigService } from '../config/config.service.interface';
import { AuthGuard } from '../common/auth.guard';

@injectable()
export class UserController extends BaseController implements IUserController {
  constructor(
    @inject(TYPES.ILogger) private loggerService: ILogger,
    @inject(TYPES.UserService) private userService: IUserService,
    @inject(TYPES.ConfigService) private configService: IConfigService,
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
      {
        path: '/info',
        method: 'get',
        func: this.info,
        middlewares: [new AuthGuard()],
      },
    ]);
  }

  // messages
  TEXT401 = 'Ошибка авторизации';
  TEXT422 = 'Такой пользователь уже существует';

  async login({ body }: Request<{}, {}, UserLoginDto>, res: Response, next: NextFunction): Promise<void> {
    this.loggerService.log(`[UsersController] login: ${body.email} - ${body.password}`);
    const result = await this.userService.validateUser(body);
    if (!result) {
      return next(new HTTPError(401, this.TEXT401, 'login'));
    }
    const jwt = await this.signJWT(body.email, this.configService.get('SECRET'));
    this.ok(res, { jwt });
  }

  async register({ body }: Request<{}, {}, UserRegisterDto>, res: Response, next: NextFunction): Promise<void> {
    this.loggerService.log(`[UsersController] register: ${body.email} - ${body.password}`);
    const result = await this.userService.createUser(body); // бизнес-логика
    if (!result) {
      return next(new HTTPError(422, this.TEXT422, 'register'));
    }
    const { email, id } = result;
    this.ok(res, { email, id });
  }

  async info({ user }: Request, res: Response, next: NextFunction): Promise<void> {
    const userInfo = await this.userService.getUserInfo(user);
    this.ok(res, { email: userInfo?.email, id: userInfo?.id });
  }

  private signJWT(email: string, secret: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const payload = { email, iat: Math.floor(Date.now() / 1000) };
      const options: SignOptions = { algorithm: 'HS256' };
      sign(payload, secret, options, (err, token) => {
        if (err) reject(err);
        resolve(token as string); // as == сюда доходим, если нет ошибки и токен - строка
      });
    });
  }
}

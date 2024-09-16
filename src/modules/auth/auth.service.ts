/**
 * @file Auth service
 * @module module/auth/service
 */

import lodash from "lodash";
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { AuthPayload, TokenResult } from "./auth.interface";
import { AuthLoginDTO } from "./auth.dto";
import { UserService } from "../user/user.service";
import * as bcrypt from "bcrypt";
import * as APP_CONFIG from "@app/app.config";
import { User } from "../user/entities/user.entity";

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService, // Dịch vụ để tạo và xác minh JWT
    private readonly userService: UserService // Dịch vụ để quản lý người dùng
  ) {}

  /**
   * Tạo token JWT cho người dùng với thông tin payload cung cấp.
   * @param data - Payload chứa thông tin người dùng và các quyền liên quan.
   * @returns - Token JWT và thông tin về token (bao gồm thời gian hết hạn và thông tin người dùng).
   */
  public async createToken(data: AuthPayload): Promise<TokenResult> {
    let user: any = await this.userService.authToken(data.userName);
    if (!user) {
      user = {};
    }
    return {
      access_token: this.jwtService.sign(data), // Tạo token JWT từ payload
      expires_in: APP_CONFIG.AUTH.expiresIn as number, // Thời gian hết hạn của token
      user: user, // Thông tin người dùng
    };
  }

  /**
   * Xác minh token JWT và giải mã dữ liệu từ token.
   * @param token - Token JWT cần được giải mã.
   * @returns - Payload từ token.
   */
  public verifyToken(token: any) {
    return this.jwtService.decode(token);
  }

  /**
   * Kiểm tra tính hợp lệ của dữ liệu xác thực dựa trên payload.
   * @param payload - Dữ liệu payload để xác thực.
   * @returns - Nếu dữ liệu xác thực hợp lệ, trả về dữ liệu payload; ngược lại, trả về null.
   */
  public validateAuthData(payload: any): Promise<any> {
    const isVerified = lodash.isEqual(payload.data, APP_CONFIG.AUTH.data);
    return isVerified ? payload.data : null;
  }

  /**
   * Đăng nhập người dùng với thông tin đăng nhập.
   * @param authLoginDTO - DTO chứa thông tin đăng nhập của người dùng (username và password).
   * @returns - Người dùng nếu đăng nhập thành công; ngược lại, trả về false.
   */
  public async adminLogin(authLoginDTO: AuthLoginDTO) {
    const user = await this.userService.findOneByUserName(authLoginDTO.userName);
    if (user && user.status) {
      const check = await this.comparePassword(authLoginDTO.password, user.password);
      if (!user || !check) {
        return false;
      } else {
        return user;
      }
    }
    return false;
  }

  /**
   * Đăng nhập và tạo token cho người dùng đã được xác thực.
   * @param user - Đối tượng người dùng để tạo token.
   * @returns - Token JWT cho người dùng.
   */
  async login(user: User) {
    const payload: AuthPayload = {
      userName: user.userName,
      roles: user.roles,
      isSuperAdmin: user.isSuperAdmin,
    };

    return this.createToken(payload);
  }

  /**
   * So sánh mật khẩu nhập vào với mật khẩu đã lưu trong cơ sở dữ liệu.
   * @param password - Mật khẩu nhập vào từ người dùng.
   * @param storePasswordHash - Mật khẩu đã được băm và lưu trữ trong cơ sở dữ liệu.
   * @returns - True nếu mật khẩu khớp; ngược lại, false.
   */
  async comparePassword(
    password: string,
    storePasswordHash: string
  ): Promise<any> {
    return await bcrypt.compare(password, storePasswordHash);
  }

  /**
   * Tìm người dùng bằng cách giải mã token JWT.
   * @param token - Token JWT chứa thông tin người dùng.
   * @returns - Đối tượng người dùng nếu tìm thấy; ngược lại, ném lỗi UnauthorizedException.
   */
  
  public async findUserByUsername(userName: string): Promise<User> {
    try {
      // Giả sử findOneByUserName trả về một User có thuộc tính _id
      const user = await this.userService.findOneByUserName(userName);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }
      return user;
    } catch (error) {
      console.error('Error finding user by username:', error);
      throw new UnauthorizedException('Invalid token');
    }
  }
  
}
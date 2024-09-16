import lodash, { includes } from "lodash";
import { Role } from "@app/modules/role/entities/role.entity";
import { User } from "@app/modules/user/entities/user.entity";
import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Observable } from "rxjs";
import { HttpUnauthorizedError } from "@app/errors/unauthorized.error";
import { Ref } from "@typegoose/typegoose";

/**
 * Enum định nghĩa các phương thức HTTP mà guard có thể xử lý.
 * @enum MethodList
 */
export enum MethodList {
  GET = "get",
  POST = "post",
  PUT = "put",
  DELETE = "delete",
  PATH = "path",
}

/**
 * Giao diện mô tả thông tin về các route mà guard sẽ kiểm tra quyền truy cập.
 * @interface RoutePayloadInterface
 */
export interface RoutePayloadInterface {
  path: string;         // Đường dẫn của route
  method: MethodList;   // Phương thức HTTP (GET, POST, PUT, DELETE, PATCH)
  resource?: string;    // Tài nguyên (tuỳ chọn)
  description?: string; // Mô tả (tuỳ chọn)
  isDefault?: boolean;  // Cờ xác định route có phải là mặc định hay không (tuỳ chọn)
}

/**
 * Đối tượng ánh xạ các hành động với các phương thức HTTP.
 * @constant MapMethodsActions
 */
export const MapMethodsActions = {
  manage: [MethodList.GET, MethodList.POST, MethodList.PUT, MethodList.DELETE],
  create: [MethodList.POST],
  read: [MethodList.GET],
  update: [MethodList.PUT, MethodList.PATH],
  delete: [MethodList.DELETE],
};

/**
 * Guard kiểm tra quyền truy cập của người dùng dựa trên các quy định và phân quyền.
 * @class PoliciesGuard
 * @implements CanActivate
 */
@Injectable()
export class PoliciesGuard implements CanActivate {

  /**
   * Kiểm tra xem người dùng có quyền truy cập vào route hiện tại không.
   * @param context - Ngữ cảnh thực thi của request.
   * @returns `true` nếu người dùng có quyền truy cập, `false` nếu không có.
   */
  canActivate(
    context: ExecutionContext
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const path = request.route.path; // Đường dẫn của route
    const method = request.method.toLowerCase(); // Phương thức HTTP, chuyển thành chữ thường
    const user = request.user; // Thông tin người dùng từ request

    // Tạo đối tượng mô tả quyền truy cập dựa trên đường dẫn và phương thức
    const permissionPayload: RoutePayloadInterface = {
      path,
      method,
    };

    // Kiểm tra quyền của người dùng
    return this.checkIfUserHavePermission(user, permissionPayload);
  }

  /**
   * Kiểm tra xem người dùng có quyền truy cập vào tài nguyên được yêu cầu không.
   * @param user - Thông tin người dùng.
   * @param permissionAgainst - Thông tin về quyền truy cập yêu cầu.
   * @returns `true` nếu người dùng có quyền, `false` nếu không có.
   */
  checkIfUserHavePermission(
    user: User,
    permissionAgainst: RoutePayloadInterface
  ): boolean {
    const { path, method } = permissionAgainst; // Lấy thông tin đường dẫn và phương thức từ payload
    console.log("---->user", user);

    // Nếu không có thông tin người dùng, ném lỗi không được phép
    if (typeof user === "undefined") {
      throw new HttpUnauthorizedError();
    }

    // Nếu người dùng là super admin, cấp quyền truy cập mọi route
    if (user.isSuperAdmin) {
      return true;
    }

    try {
      const modules = lodash.split(path, "/", 2); // Tách đường dẫn thành các phần
      const roles: Role[] = user.roles as Role[]; // Lấy danh sách vai trò của người dùng

      if (user && roles.length > 0) {
        // Lặp qua tất cả các vai trò
        for (let role of roles) {
          const permissions = role.permissions; // Lấy quyền của vai trò

          // Lặp qua tất cả các quyền
          for (let permission of permissions) {
            // Kiểm tra xem quyền có phù hợp với đường dẫn yêu cầu không
            if (modules.some((v) => permission.name === v)) {
              const actions = permission.actions; // Lấy các hành động được phép

              // Lặp qua tất cả các hành động
              for (const action of actions) {
                const hasAction = MapMethodsActions[action]; // Lấy các phương thức HTTP tương ứng với hành động
                console.log("-----> actions: ", hasAction);

                // Kiểm tra xem phương thức HTTP của request có trong danh sách hành động không
                if (hasAction.includes(method)) {
                  return true;
                }
              }
            }
          }
        }
      }

      // Nếu không tìm thấy quyền hợp lệ, trả về false
      return false;
    } catch (error) {
      // Nếu có lỗi xảy ra, trả về false
      return false;
    }
  }
}

// Nhập các decorator từ thư viện `class-validator` để xác thực dữ liệu
import {
  IsString,
  IsDefined,
  IsNotEmpty,
  IsBoolean,
  IsInt,
  IsOptional,
  IsEmail,
} from "class-validator";

// Định nghĩa lớp DTO (Data Transfer Object) cho việc tạo Super Admin
export class CreateSuperAdminDto {
  
  // Xác nhận rằng `userName` không được để trống và phải được định nghĩa
  // Ngoài ra, nó phải là một chuỗi (string)
  @IsNotEmpty({ message: "username?" }) // Thông báo lỗi nếu `userName` bị bỏ trống
  @IsDefined() // Đảm bảo `userName` được định nghĩa
  @IsString() // Xác nhận rằng `userName` phải là chuỗi
  userName: string;

  // Xác nhận rằng `password` không được để trống và phải được định nghĩa
  // Ngoài ra, nó phải là một chuỗi (string)
  @IsNotEmpty({ message: "password?" }) // Thông báo lỗi nếu `password` bị bỏ trống
  @IsDefined() // Đảm bảo `password` được định nghĩa
  @IsString() // Xác nhận rằng `password` phải là chuỗi
  password: string;

  // Xác nhận rằng `email` (nếu có) phải là một chuỗi và phải có định dạng email hợp lệ
  // `email` là tùy chọn, có thể không cung cấp giá trị
  @IsString() // Xác nhận rằng `email` phải là chuỗi
  @IsEmail() // Xác nhận rằng `email` phải là địa chỉ email hợp lệ
  @IsOptional() // Cho phép `email` không có giá trị (tùy chọn)
  email?: string;

  // Xác nhận rằng `phone` (nếu có) phải là một chuỗi
  // `phone` là tùy chọn, có thể không cung cấp giá trị
  @IsString() // Xác nhận rằng `phone` phải là chuỗi
  @IsOptional() // Cho phép `phone` không có giá trị (tùy chọn)
  phone?: string;

  // Xác nhận rằng `isSuperAdmin` phải là giá trị boolean (true hoặc false)
  @IsBoolean() // Xác nhận rằng `isSuperAdmin` phải là boolean
  isSuperAdmin: boolean;

  // Xác nhận rằng `status` phải là số nguyên
  @IsInt() // Xác nhận rằng `status` phải là số nguyên
  status: number;
}

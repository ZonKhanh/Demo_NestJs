import {
  IsString,           // Kiểm tra xem giá trị có phải là chuỗi không
  IsDefined,         // Kiểm tra xem giá trị có được định nghĩa không
  IsNotEmpty,        // Kiểm tra xem giá trị có bị bỏ trống không
  IsInt,             // Kiểm tra xem giá trị có phải là số nguyên không
  IsArray,           // Kiểm tra xem giá trị có phải là mảng không
  IsOptional,        // Kiểm tra xem giá trị có thể là tùy chọn không
  ArrayUnique,       // Kiểm tra xem các phần tử trong mảng có phải là duy nhất không
  ArrayNotEmpty,     // Kiểm tra xem mảng có ít nhất một phần tử không
  MaxLength,
  IsDate,
  IsEmail ,           // Kiểm tra xem giá trị có phải là địa chỉ email hợp lệ không
} from "class-validator";

// Định nghĩa DTO để tạo bệnh nhân mới
export class CreatePatientDto {

  // Tên người dùng, không được để trống, phải là chuỗi và được định nghĩa
  @IsString() 
  @IsNotEmpty({ message: "first name?"}) 
  @MaxLength(100)
  firstName: string; 

  @IsString() 
  @IsNotEmpty({ message: "first name?"}) 
  @MaxLength(100)
  lastName: string; 

  // email hợp lệ và tùy chọn
  @IsString()
  @IsEmail()
  @IsOptional()
  @MaxLength(100)
  email: string;


  @IsString()
  @IsOptional()
  @MaxLength(20)
  phone: string;

  @IsString() 
  @IsNotEmpty()
  @MaxLength(255)
  address: string; 

  // @IsDate() 
  @IsOptional() 
  dob: Date;

  @IsString()
  @IsOptional()
  @MaxLength(3)
  bloodGroup: string;

  @IsInt()
  @IsOptional()
  gender: number = 1;

  @IsInt()
  status: number = 1;
}

// Định nghĩa DTO để làm việc với nhiều bệnh nhân
export class PatientsDTO {
  // Danh sách các ID bệnh nhân, là mảng, không được rỗng và các phần tử phải duy nhất
  @ArrayUnique()
  @ArrayNotEmpty()
  @IsArray()
  patientIds: string[];
}

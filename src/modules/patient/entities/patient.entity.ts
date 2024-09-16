import { AutoIncrementID } from "@typegoose/auto-increment";
import { prop, plugin, modelOptions, Ref } from "@typegoose/typegoose"; 
import { generalAutoIncrementIDConfig } from "@app/constants/increment.constant"; 
import { getProviderByTypegooseClass } from "@app/transformers/model.transformer"; 
import { mongoosePaginate } from "@app/utils/paginate"; // Import plugin paginate để phân trang dữ liệu trong MongoDB.
// import { Role } from "@app/modules/role/entities/role.entity"; // Import model Role để sử dụng trong trường roles.
import { SexState, PatientStatus } from "@app/constants/biz.constant"; // Import các status config từ constants.
import { 
  IsString, IsNotEmpty, IsIn, IsInt, ArrayUnique, IsBoolean, IsDefined, IsOptional, IsEmail, MaxLength, IsDate  
} from "class-validator"; // Import các validator để xác thực dữ liệu cho các trường của DTO.
import { Schema } from "mongoose"; // Import Schema từ mongoose để sử dụng cho cấu hình schema.
import  moment from 'moment';
export const PATIENT_STATUS = [PatientStatus.ACTIVE, PatientStatus.INACTIVE, PatientStatus.TRASH ] as const; 
export const PATIENT_SEX = [SexState.MALE, SexState.FEMALE] as const;

@modelOptions({
  schemaOptions: {
    timestamps: {
      createdAt: "createdAt",
      updatedAt: "updatedAt",
    },
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
})

export class Patient { // Định nghĩa class Patient đại diện cho bảng bệnh nhân.

  @IsString() // Trường phải là chuỗi.
  @IsNotEmpty() // Không được để trống.
  @MaxLength(100, { message: 'Exceeds $constraint1 characters allowed' })
  @prop({ required: true }) // Bắt buộc, phải duy nhất và được lập chỉ mục.
  firstName: string; // Tên tài khoản bệnh nhân.

  @IsString() 
  @IsNotEmpty()
  @MaxLength(100, { message: 'Exceeds $constraint1 characters allowed' })
  @prop({ required: true }) 
  lastName: string; // Tên đầy đủ của bệnh nhân.

  @IsString() 
  @IsEmail() // Phải là một email hợp lệ.
  @IsOptional() 
  @MaxLength(100, { message: 'Exceeds $constraint1 characters allowed' })
  @prop({ required: false }) 
  email: string; // Email của bệnh nhân.

  @IsString() 
  @IsOptional() 
  @MaxLength(20, { message: 'Exceeds $constraint1 characters allowed' })
  @prop({ unique: true }) 
  phone: string; // Số điện thoại của bệnh nhân.

  @IsString() 
  @IsNotEmpty()
  @MaxLength(255, { message: 'Exceeds $constraint1 characters allowed' })
  @prop({ required: true }) 
  address: string; 
  @IsString()
  @IsOptional()
  @MaxLength(10, { message: 'Exceeds $constraint1 characters allowed' })
  @prop({ required: false }) 
  bloodGroup: string;

  @IsIn(PATIENT_SEX) 
  @IsInt() 
  @IsDefined() 
  @prop({ enum: SexState, default: SexState.MALE, index: true }) 
  gender: SexState; // Trạng thái của bệnh nhân (Active hoặc UnActive).

  @IsDate() // Ràng buộc kiểu dữ liệu là ngày.
  @IsOptional() // Không bắt buộc.
  @prop({ required: false }) // Khai báo trong schema với MongoDB.
  dob: Date; // Ngày tháng nhập vào


  @IsIn(PATIENT_STATUS) 
  @IsInt() 
  @IsDefined() 
  @prop({ enum: PatientStatus, default: PatientStatus.ACTIVE, index: true }) 
  status: PatientStatus; // Trạng thái của bệnh nhân (Online hoặc Offline).

  // @ArrayUnique() 
  // @prop({ type: () => [String], ref: () => Role }) 
  // roles?: Ref<Role, string>[] | Role[]; // Danh sách vai trò của bệnh nhân, tham chiếu tới bảng Role.

  @prop({ default: Date.now, immutable: true }) 
  createdAt?: Date; // Ngày tạo, không thể thay đổi sau khi khởi tạo.

  @prop({ default: Date.now }) 
  updatedAt?: Date; 

  @prop({ }) 
  deletedAt?: Date; 

  @prop({ ref: () => Patient, default: null }) 
  createdBy: Ref<Patient>; // Người tạo bản ghi.

  @prop({ ref: () => Patient, default: null }) 
  updatedBy: Ref<Patient>; // Người cập nhật bản ghi.

  @prop({ ref: () => Patient, default: null })
  deletedBy: Ref<Patient>;
}

export const PatientProvider = getProviderByTypegooseClass(Patient); 
// Tạo Provider từ class Patient để sử dụng trong hệ thống Dependency Injection của NestJS.

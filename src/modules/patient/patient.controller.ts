import lodash from "lodash";
import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  Query,
  UseGuards,
  Patch,
  Req,
  StreamableFile,
  Res,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from "@nestjs/common";
import { PatientService } from "./patient.service";
import { CreatePatientDto, PatientsDTO } from "./dto/create-patient.dto";
import { UpdatePatientDto } from "./dto/update-patient.dto";
import { AdminOnlyGuard } from "@app/guards/admin-only.guard";
import { Responser } from "@app/decorators/responser.decorator";
import {
  PaginateResult,
  PaginateQuery,
  PaginateOptions,
} from "@app/utils/paginate";
import { Patient } from "./entities/patient.entity";
import { PatientPaginateQueryDTO } from "./dto/query-patient.dto";
import { Role } from "../role/entities/role.entity";
import { RoleService } from "../role/role.service";
import {
  QueryParams,
  QueryParamsResult,
} from "@app/decorators/queryparams.decorator";
import { MongooseDoc } from "@app/interfaces/mongoose.interface";
import { FileInterceptor } from "@nestjs/platform-express";
import type { Response } from "express";
import moment from 'moment';
import { JwtAuthGuard } from "@app/guards/jwt-auth.guard";
import { Request } from 'express'; // Ensure this is from 'express'

@Controller("patient")
export class PatientController {
  constructor(
    private readonly patientService: PatientService,
    // private readonly roleService: RoleService
  ) { }

  // Endpoint để tạo mới bệnh nhân
  @Post()
  @UseGuards(JwtAuthGuard)
  async create(
    @Req() req: any, // Lấy toàn bộ request, trong đó chứa user đã được JwtAuthGuard xử lý
    @Body() createPatientDto: CreatePatientDto // Nhận dữ liệu bệnh nhân từ body của yêu cầu
  ): Promise<MongooseDoc<Patient>> { // Trả về đối tượng bệnh nhân dưới dạng MongooseDoc
    const userName = req.user.userName;  // Lấy userName từ request sau khi JwtAuthGuard xác thực token
    // Gọi phương thức create của service để lưu bệnh nhân vào cơ sở dữ liệu
    console.log(`UserName: ${userName}`);
    return this.patientService.create(createPatientDto, userName);
  }

  // get list patients
  @Get()
  @Responser.paginate() // Đánh dấu rằng phản hồi của yêu cầu này sẽ được phân trang
  @Responser.handle("Get patients") // Đặt tên cho phản hồi để dễ dàng theo dõi và ghi lại
  findAll(@Query() query: PatientPaginateQueryDTO): Promise<PaginateResult<Patient>> {
    // Destructuring các tham số từ query
    const { page, page_size, field, order, status, ...filters } = query;

    // Khởi tạo đối tượng truy vấn phân trang
    const paginateQuery: PaginateQuery<Patient> = {};

    // Tìm kiếm theo từ khóa
    if (filters.keyword) {
      const trimmed = lodash.trim(filters.keyword); // Loại bỏ khoảng trắng thừa
      const keywordRegExp = new RegExp(trimmed, "i"); // Tạo biểu thức chính quy để tìm kiếm không phân biệt chữ hoa chữ thường
      paginateQuery.$or = [
        { firstName: keywordRegExp }, // Tìm kiếm theo trường fullName
        { lastName: keywordRegExp }, // Tìm kiếm theo trường patientName
        { phone: keywordRegExp }, // Tìm kiếm theo trường phone
        { email: keywordRegExp }, // Tìm kiếm theo trường email
      ];
    }

    // Lọc theo trạng thái (status)
    if (!lodash.isUndefined(status)) {
      const queryState = status.split(","); // Chia trạng thái thành mảng các trạng thái
      paginateQuery.status = { $in: queryState }; // Lọc các bệnh nhân có trạng thái nằm trong mảng
    }

    // Lọc bệnh nhân có trường deletedBy là null
    paginateQuery.deletedBy = null;

    // Lọc bệnh nhân đang điều tri.
    paginateQuery.status = 1;

    // Cấu hình các tùy chọn phân trang
    const paginateOptions: PaginateOptions = { page, pageSize: page_size };

    // Sắp xếp theo trường và thứ tự nếu có
    if (field && order) {
      const setSort = {};
      setSort[field] = order;
      paginateOptions.sort = setSort;
    }

    // Trả về kết quả phân trang từ dịch vụ
    return this.patientService.paginator(paginateQuery, paginateOptions);
  }


  // // get init roles
  // @Get("init-roles")
  // // @UseGuards(AdminOnlyGuard, PoliciesGuard)
  // @Responser.paginate()
  // @Responser.handle("Get init roles")
  // findAllRoles(): Promise<PaginateResult<Role>> {
  //   const paginateQuery: PaginateQuery<Role> = {};
  //   const paginateOptions: PaginateOptions = {};
  //   return this.roleService.paginator(paginateQuery, paginateOptions);
  // }

  // get patient by id and phone
  @Get("id/:id")
  @UseGuards(AdminOnlyGuard)
  findOne(@Param("id") patientID: string): Promise<MongooseDoc<Patient>> {
    return this.patientService.findOne(patientID);
  }

  // get patient by phone
  @Get("phone/:phone")
  @UseGuards(AdminOnlyGuard)
  findOneByPatientPhone(@Param("phone") phone: string): Promise<MongooseDoc<Patient>> {
    return this.patientService.findOneByPatientPhone(phone);
  }
  
  @Get(":key/:value")
  @UseGuards(AdminOnlyGuard)
  async findByField(
    @Param("key") key: string,
    @Param("value") value: string
  ): Promise<MongooseDoc<Patient>[]> {
    try {
      const query = value === 'null' ? { [key]: null } : { [key]: value };
      return await this.patientService.findPatientsByField(query);
    } catch (error) {
      throw new Error(`Error finding patients with ${key} ${value}: ${error.message}`);
    }
  }
  
  
  // update patient
  @Put(":id")
  @UseGuards(JwtAuthGuard)
  @UseGuards(AdminOnlyGuard)
  async update(
    @Req() req: any,
    @Param("id") patientID: string,
    @Body() updateUserDto: UpdatePatientDto
  ): Promise<MongooseDoc<Patient>> {
    const userName = req.user.userName; 
    return this.patientService.update(patientID, updateUserDto, userName);
  }

  // update status patient
  @Patch("status/:id")
  @UseGuards(JwtAuthGuard)
  @UseGuards(AdminOnlyGuard)
  // @Responser.handle("Update status patient")
  async updateStatus(
    @Req() req: any,
    @Param("id") patientID: string,
    @Body() newPatient: { status: number }
  ): Promise<MongooseDoc<Patient>> {
    const userName = req.user.userName;
    return this.patientService.updateStatus(patientID, newPatient.status,userName);
  }

  // @UseGuards(AdminOnlyGuard, PoliciesGuard)
  // delete patient
  @UseGuards(JwtAuthGuard)
  @Delete(":id")
  remove(
    @Req() req: any,  // Lấy toàn bộ request, trong đó chứa user đã được JwtAuthGuard xử lý
    @QueryParams() { params }: QueryParamsResult  // Lấy params từ URL
  ): Promise<MongooseDoc<Patient>> {
    const userName = req.user.userName;  // Lấy userName từ request sau khi JwtAuthGuard xác thực token
    return this.patientService.remove(params.id, userName);  // Truyền userName vào service
  }

  // delete many patients
  @UseGuards(JwtAuthGuard, AdminOnlyGuard) // Kết hợp guards nếu có thể
  @Delete()
  async delUsers(@Req() req: any, @Body() body: PatientsDTO) {
    const userName = req.user.userName;
    return this.patientService.batchDelete(body.patientIds, userName);
  }
}
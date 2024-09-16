import { Injectable } from "@nestjs/common";
import { InjectModel } from "@app/transformers/model.transformer";
import { CreatePatientDto } from "./dto/create-patient.dto";
import { UpdatePatientDto } from "./dto/update-patient.dto";
import { Patient } from "./entities/patient.entity";
import { AuthService } from "../auth/auth.service";

import {
  MongooseModel,
  MongooseDoc,
  MongooseID,
} from "@app/interfaces/mongoose.interface";
import {
  PaginateResult,
  PaginateQuery,
  PaginateOptions,
} from "@app/utils/paginate";
import { PatientStatus } from "@app/constants/biz.constant";
import moment from 'moment';

@Injectable()
export class PatientService {
  [x: string]: any;
  constructor(
    @InjectModel(Patient) private readonly patientModel: MongooseModel<Patient>,
    private readonly authService: AuthService
  ) { }

  // get list users
  async paginator(
    query: PaginateQuery<Patient>,
    options: PaginateOptions
  ): Promise<PaginateResult<Patient>> {
    return await this.patientModel.paginate(query, {
      ...options,
      // populate: [{ path: "roles" }],
    });
  }

  // Trong PatientService
  async create(createPatientDto: CreatePatientDto, userName: string): Promise<MongooseDoc<Patient>> {
   
    const user = await this.authService.findUserByUsername(userName);
    const userId = user._id.toString(); 

    // Kiểm tra xem số điện thoại đã tồn tại chưa
    const existedPhone = await this.patientModel
      .findOne({ phone: createPatientDto.phone })
      .exec();
    if (existedPhone) {
      throw new Error(`Phone number ${createPatientDto.phone} already exists!`);
    }

    // Tạo bệnh nhân mới với trường createdBy được gán giá trị
    let patient = await this.patientModel.create({
      ...createPatientDto,
      createdBy: userId  
    });
    // Tìm và trả về bệnh nhân mới tạo
    return await this.findOne(String(patient._id));
  }


  // Tìm bệnh nhân theo số điện thoại
  async findOneByPatientPhone(phone: string): Promise<MongooseDoc<Patient>> {
    return await this.patientModel
      .findOne({
        phone: phone,
        status: PatientStatus.ACTIVE,
      })
      .then(
        (result) =>
          result ||
          Promise.reject(`Patientname "${phone}" isn't found or is inactive!`)
      );
  }

  // Tìm tất cả trường dữ liệu
  async findPatientsByField(query: Partial<Patient>): Promise<MongooseDoc<Patient>[]> {
    return await this.patientModel
      .find({
        ...query, // Tìm kiếm với tất cả các trường truyền vào trong query
        status: PatientStatus.ACTIVE, 
      })
      .then(
        (results) => {
          if (results.length === 0) {
            throw new Error(`No patients found with info ${JSON.stringify(query)} or all are inactive!`);
          }
          return results;
        }
      );
  }
  
  // get patient by id
  async findOne(patientID: string): Promise<MongooseDoc<Patient>> {
    return await this.patientModel
      .findOne({ _id: patientID, status: PatientStatus.ACTIVE })
      .populate(["createdBy"])
      .select("-password")
      .exec()
      .then(
        (result) => result || Promise.reject(`Patient id "${patientID}" isn't found or is inactive!`)
      );
  }

  // update patient
  async update(
    patientID: string, updatePatientDto: UpdatePatientDto, userName: any): Promise<MongooseDoc<Patient>> {
    const user = await this.authService.findUserByUsername(userName);
    const userId = user._id.toString();
    updatePatientDto.updatedBy = userId;

    const patient = await this.patientModel
      .findByIdAndUpdate(patientID, updatePatientDto, { new: true })
      .exec();
    if (!patient) throw `Patient id "${patientID}" isn't found`;
    return await this.findOne(String(patient._id));
  }

  // update status patients
  async updateStatus(
    patientID: string, status: number, userName: any): Promise<MongooseDoc<Patient>> {
    const user = await this.authService.findUserByUsername(userName);
    const userId = user._id.toString();

    const patient = await this.patientModel
      .findByIdAndUpdate(patientID, {
        status: status,
        updatedBy: userId,
        deletedBy: null,
        deletedAt: null,
        updatedAt: moment
      },
        { new: true })
      .exec();
    if (!patient) throw `Patient id "${patientID}" isn't found`;
    return await this.findOne(String(patient._id));
  }

  // Xóa
  async remove(patientID: MongooseID, userName: string): Promise<MongooseDoc<Patient>> {
    // Tìm người dùng theo userName
    const user = await this.authService.findUserByUsername(userName);
    const userId = user._id.toString(); 
   
    const patient = await this.patientModel.findById(patientID).exec();

    if (!patient) {
      throw new Error(`Patient id "${patientID}" isn't found`);
    }
    // Kiểm tra trạng thái của bệnh nhân
    if (patient.status !== PatientStatus.TRASH) {
      const updatedPatient = await this.patientModel
        .findByIdAndUpdate(
          patientID,
          {
            deletedBy: userId,  // Lưu userId vào trường deletedBy
            deletedAt: moment(),
            status: PatientStatus.TRASH,
          },
          { new: true }
        )
        .exec();
      if (!updatedPatient) {
        throw new Error(`Failed to remove patient with id "${patientID}"`);
      }
      return updatedPatient;
    }
    throw new Error(`Cannot remove patient with status ${patient.status}`);
  }

  // Xóa hàng loạt bệnh nhân cùng lúc
  public async batchDelete(patientIDs: MongooseID[], userName: any): Promise<{ updatedPatients: Patient[], errors: string[] }> {
  
    const user = await this.authService.findUserByUsername(userName);
    const userId = user._id.toString(); 

    // Tìm tất cả bệnh nhân có ID trong danh sách patientIDs
    const patients = await this.patientModel.find({ _id: { $in: patientIDs } }).exec();

    // Không tìm thấy
    if (patients.length === 0) {
      throw new Error(`Patients aren't found!`);
    }

    // Khởi tạo mảng để lưu trữ bệnh nhân đã xóa và thông báo lỗi
    const updatedPatients: Patient[] = [];
    const errors: string[] = [];

    // Kiểm tra status từng bệnh nhân
    for (const patient of patients) {
      if (patient.status === PatientStatus.TRASH) {
        errors.push(`Patient ${patient._id} cannot be removed due to status ${PatientStatus.TRASH}`);
      } else {
        
        await this.patientModel.updateOne(
          { _id: patient._id },
          {
            deletedBy: userId,  
            deletedAt: moment().toDate(),
            status: PatientStatus.TRASH,
          }
        ).exec();

        // Truy vấn lại thông tin bệnh nhân sau khi cập nhật
        const updatedPatient = await this.patientModel.findById(patient._id).exec();

        // Kiểm tra nếu `updatedPatient` là null thì không thêm vào danh sách
        if (updatedPatient !== null) {
          updatedPatients.push(updatedPatient);
        } else {
          errors.push(`Failed to fetch updated data for patient ${patient._id}`);
        }
      }
    }
    return { updatedPatients, errors };
  }

}
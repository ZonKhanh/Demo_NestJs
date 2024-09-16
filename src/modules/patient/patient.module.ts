import { Module } from "@nestjs/common";
import { PatientService } from "./patient.service";
import { PatientController } from "./patient.controller";
import { PatientProvider } from "./entities/patient.entity";
// import { RoleService } from "../role/role.service";
// import { RoleProvider } from "../role/entities/role.entity";
import { PermissionProvider } from "../permission/entities/permission.entity";
import { PermissionService } from "../permission/permission.service";
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [PatientController],
  providers: [
    PatientService,
    PatientProvider,
    // RoleService,
    // RoleProvider,
    PermissionService,
    PermissionProvider,
  ],
  exports: [PatientService, ],
})
export class PatientModule {}

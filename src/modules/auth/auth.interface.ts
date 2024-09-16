/**
 * @file Auth token interface
 * @module module/auth/interface
 */
import { Ref } from "@typegoose/typegoose";
import { Role } from "../role/entities/role.entity";

export interface TokenResult {
  access_token: string;
  expires_in: number;
  user: object;
}

export interface AuthPayload {
  userName: string;
  isSuperAdmin: boolean;
  roles: Ref<Role, string>[] | undefined | Role[];
}

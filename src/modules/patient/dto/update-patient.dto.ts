import {
  IsString,                 
  IsNotEmpty,        
  IsInt,                       
  IsOptional,        
  // ArrayUnique,       
  // ArrayNotEmpty,     
  IsEmail,           
  MaxLength,
} from "class-validator";

export class UpdatePatientDto {

  @IsOptional()
  @IsString() 
  @IsNotEmpty({ message: "first name?"}) 
  @MaxLength(100)
  firstName: string; 

  @IsOptional()
  @IsString() 
  @IsNotEmpty({ message: "first name?"}) 
  @MaxLength(100)
  lastName: string; 

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
  @IsOptional()
  @MaxLength(255)
  address: string;

  @IsOptional() 
  dob: Date;

  @IsString()

  @IsOptional()
  @MaxLength(3)
  bloodGroup: string;

  @IsInt()
  @IsOptional()
  gender: number;

  @IsString()
  @IsOptional()
  updatedBy: string;

  @IsOptional()
  @IsInt()
  status: number;
}

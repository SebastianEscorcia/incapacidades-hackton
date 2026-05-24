import {
  BadRequestException,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseFilePipeBuilder,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { AiService } from '../services/ai.service';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('upload-incapacidad')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FileInterceptor('documento', {
      storage: memoryStorage(),
      limits: {
        fileSize: 5 * 1024 * 1024,
      },
    }),
  )
  async processIncapacidad(
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({
          fileType: /(jpg|jpeg|png|pdf)$/i,
        })
        .addMaxSizeValidator({
          maxSize: 5 * 1024 * 1024,
        })
        .build({
          fileIsRequired: true,
          errorHttpStatusCode: HttpStatus.BAD_REQUEST,
        }),
    )
    file: Express.Multer.File,
  ) {
    return this.aiService.procesarIncapacidad(file.buffer, file.mimetype);
  }

  @HttpCode(HttpStatus.OK)
  @Get('incapacidad/:id')
  async getIncapacidadParaRevision(@Param('id') id: string) {
    if (!id) {
      throw new BadRequestException('El ID de la incapacidad es requerido.');
    }
    
    const detalle = await this.aiService.obtenerIncapacidadParaRevision(id);
    return detalle;
  }
  

  /**
   * Endpoint para listar todas las incapacidades con filtros opcionales
   * URL Ejemplos: 
   * - GET /ai/incapacidades
   * - GET /ai/incapacidades?paciente_documento=106587
   * - GET /ai/incapacidades?paciente_nombre=luis
   * - GET /ai/incapacidades?paciente_documento=1065&paciente_nombre=luis
   */
  @Get('incapacidades')
  async getAllIncapacidades(
    @Query('paciente_documento') documento?: string,
    @Query('paciente_nombre') nombre?: string,
  ) {
    return await this.aiService.obtenerTodasLasIncapacidades(documento, nombre);
  }

  @Get('dashboard/resumen-estados')
  async getDashboardResumenEstados() {
    return await this.aiService.obtenerResumenDashboard();
  }
}
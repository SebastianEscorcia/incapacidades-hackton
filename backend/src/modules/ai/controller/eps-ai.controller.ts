import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { EpsAiService } from '../services/eps-ai.service';

@Controller('eps-ai')
export class EpsAiController {
  constructor(private readonly epsAiService: EpsAiService) {}

  @Post('simular-respuesta')
  @HttpCode(HttpStatus.OK)
  async simularRespuesta(@Body() body: any) {
    const incapacidadId = body?.incapacidadId || 'manual-sim';
    const resultadoIA = body?.resultadoIA || null;
    const scrapingResultados = body?.scrapingResultados || null;

    const epsResponse = await this.epsAiService.simularRespuestaEps(
      incapacidadId,
      resultadoIA,
      scrapingResultados,
    );

    return {
      incapacidadId,
      eps_response: epsResponse,
    };
  }
}

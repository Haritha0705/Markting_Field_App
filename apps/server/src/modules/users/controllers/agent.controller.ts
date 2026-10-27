import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Role } from '../enums/users-type.enum';
import { AgentStatusDto } from '../dto/agent/agent-status.dto';
import { ResetPasswordDto } from '../dto/agent/reset-password.dto';
import { API_ROUTES } from '../../../common/constants';
import { AgentService } from '../service/agent.service';
import { CreateAgentDto } from '../dto/agent/create-agent.dto';
import { UpdateAgentDto } from '../dto/agent/update-agent.dto';
import { UpdateAgentProfileDto } from '../dto/agent/update-agent-profile.dto';

@Roles(Role.SuperAdmin, Role.Admin)
@Controller(API_ROUTES.AGENTS)
export class AgentController {
  constructor(private readonly agentService: AgentService) {}

  @Post()
  create(@Body() createAgentDto: CreateAgentDto) {
    return this.agentService.createAgent(createAgentDto);
  }

  @Get()
  getAll(
    @Query('pageNumber') pageNumber: number = 0,
    @Query('size') size: number = 10,
  ) {
    return this.agentService.getAllAgents(pageNumber, size);
  }

  @Get('overview')
  overview(@Query('search') search?: string) {
    return this.agentService.getOverview(search);
  }

  @Patch(':id/status')
  setStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AgentStatusDto,
  ) {
    return this.agentService.setStatus(id, dto.isActive);
  }

  @Put(':id/password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ResetPasswordDto,
  ) {
    await this.agentService.resetPassword(id, dto.newPassword);
    return { message: 'Password reset' };
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.agentService.findByIdAgent(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateAgentDto: UpdateAgentDto,
  ) {
    return this.agentService.updateAgent(id, updateAgentDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.agentService.deleteAgent(id);
  }

  @Get(':id/profile')
  getUserProfile(@Param('id', ParseUUIDPipe) id: string) {
    return this.agentService.getAgentProfile(id);
  }

  @Patch(':id/profile')
  updateUserProfile(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateAgentProfileDto: UpdateAgentProfileDto,
  ) {
    return this.agentService.updateAgentProfile(id, updateAgentProfileDto);
  }
}

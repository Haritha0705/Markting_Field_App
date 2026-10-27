import { Controller, Get } from '@nestjs/common';
import { API_ROUTES } from '../../../common/constants';
import { ApplicationService } from '../services/application.service';

@Controller(API_ROUTES.BRANCHES)
export class BranchController {
  constructor(private readonly applicationService: ApplicationService) {}

  @Get()
  findAll() {
    return this.applicationService.findBranches();
  }
}

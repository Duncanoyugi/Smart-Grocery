import { 
  Controller, 
  Post, 
  Body, 
  UseGuards, 
  Req, 
  Get, 
  Patch, 
  Param, 
  Delete,
  ParseUUIDPipe 
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { StoresService } from './store.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';

@Controller('stores')
export class StoresController {
  constructor(private readonly storesService: StoresService) {}

  // POST /stores - ADMIN only
  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Req() req, @Body() dto: CreateStoreDto) {
    const userId = req.user?.id ?? req.user?.sub;
    const userRole = req.user?.role;
    return this.storesService.createStore(userId, userRole, dto);
  }

  // GET /stores - Public (get all stores)
  @Get()
  async getAllStores() {
    return this.storesService.getAllStores();
  }

  // GET /stores/me - Get current user's store
  @Get('me')
  @UseGuards(JwtAuthGuard)
  async myStore(@Req() req) {
    const userId = req.user?.id ?? req.user?.sub;
    return this.storesService.getMyStore(userId);
  }

  // GET /stores/:id - Public (get store by ID)
  @Get(':id')
  async getStoreById(@Param('id', ParseUUIDPipe) id: string) {
    return this.storesService.getStoreById(id);
  }

  // PATCH /stores/:id - ADMIN or store owner
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Req() req, 
    @Param('id', ParseUUIDPipe) id: string, 
    @Body() dto: UpdateStoreDto
  ) {
    const userId = req.user?.id ?? req.user?.sub;
    const userRole = req.user?.role;
    return this.storesService.updateStore(userId, userRole, id, dto);
  }

  // DELETE /stores/:id - ADMIN only
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async delete(@Req() req, @Param('id', ParseUUIDPipe) id: string) {
    const userId = req.user?.id ?? req.user?.sub;
    const userRole = req.user?.role;
    return this.storesService.deleteStore(userId, userRole, id);
  }
}
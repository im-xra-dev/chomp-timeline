import { Test, TestingModule } from '@nestjs/testing';
import { TLineController } from './t-line.controller';
import {describe, expect, it} from "@jest/globals";

describe('TLineController', () => {
  let controller: TLineController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TLineController],
    }).compile();

    controller = module.get<TLineController>(TLineController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

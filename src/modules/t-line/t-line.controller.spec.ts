import { Test, TestingModule } from '@nestjs/testing';
import { TLineController } from './t-line.controller';
import {describe, expect, it} from "@jest/globals";
import {TLineService} from "./t-line.service";

describe('TLineController', () => {
  let controller: TLineController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TLineController],
      providers: [
        {
          provide: TLineService,
          useValue: {
            ping: jest.fn(),
            generateBlock: jest.fn(),
            getBlock: jest.fn(),
          }
        },
      ],

    }).compile();

    controller = module.get<TLineController>(TLineController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

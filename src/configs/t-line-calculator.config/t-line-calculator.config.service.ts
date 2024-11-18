import { Injectable } from '@nestjs/common';

@Injectable()
export class TLineCalculatorConfigService {
    /*
      CODE_N_A_M_E
       S = SCORE
       W = WEIGHT
       C = CONST
     */
    SW_SEC_REL = 2;
    SW_AUTHOR_PER = 1.5;
    SW_AUTHOR_REL = 1.5;
    SW_THREAD_REL = 1;
    SW_POST_PER = 0.5;
    W_CALCULATED = 0.5;

    C_ATAN_DIVISOR = 50;


}

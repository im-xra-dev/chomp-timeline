import { Injectable } from '@nestjs/common';

@Injectable()
export class TLineCalculatorConfigService {
    /*
      CODE_N_A_M_E
       S = SCORE
       W = WEIGHT
       C = CONST
       F = FUNCTION
     */

    SW_SEC_REL = 2;
    SW_AUTHOR_PER = 1.5;
    SW_AUTHOR_REL = 1.5;
    SW_THREAD_REL = 1;
    SW_POST_PER = 0.5;
    W_CALCULATED = 0.5;

    C_ATAN_DIVISOR = 50;

    C_IDEAL_POSTS_PER_SEC = 3;

    // desmos code y=\frac{1}{x+4}\ +\ 0.75
    F_SEEN_WEIGHT = (x) => (1 / (x + 4)) + 0.75
}

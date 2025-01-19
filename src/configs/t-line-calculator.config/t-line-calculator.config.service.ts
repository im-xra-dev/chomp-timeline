    import { Injectable } from '@nestjs/common';

    @Injectable()
    export class TLineCalculatorConfigService {
        /*
          CODE_N_A_M_E
           S = SCORE
           W = WEIGHT
           C = CONST
           F = FUNCTION (an equation)
         */

        C_FOLLOW_BOOST = 1.25;

        SW_SEC_REL = 2;
        SW_AUTHOR_PER = 1.5;
        SW_AUTHOR_REL = 1.5;
        SW_THREAD_REL = 1;
        SW_POST_PER = 0.5;
        W_CALCULATED = 0.5;

        C_ATAN_DIVISOR = 50;

        C_IDEAL_POSTS_PER_SEC = 3;

        // desmos code y=\frac{1}{x+4}\ +\ 0.75
        F_SEEN_WEIGHT = (x) => 1 / (x + 4) + 0.75;

        // * https://www.desmos.com/calculator/mglnoluywe
        // * https://www.desmos.com/3d/alifqxuuke
        //min-point on curve is at idealBatchSize = sqrt(2c)
        F_BATCH_SIZE_MIN_POINT = (c) => Math.sqrt(2 * c);
        F_IDEAL_BATCH_COUNT = (n, c) => n / this.F_BATCH_SIZE_MIN_POINT(c);
    }

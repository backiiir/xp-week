// IRQ _ Interface Request
// IRP _ Interface Response

import { Reaction } from '../../enums/reaction.enum';
import { Role } from '../../enums/role.enum';
import { Schedule } from '../../enums/schedule.enum';

export interface IRQ_CreateGroup {
  name: string;
  memberName: string;
}

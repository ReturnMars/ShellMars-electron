import { registerTestIpc } from './test'
import { registerSshIpc } from './ssh'
export const registerIpc = (): void => {
  registerTestIpc()
  registerSshIpc()
}

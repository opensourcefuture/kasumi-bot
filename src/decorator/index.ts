import { cqStrToArr, isEqualStr } from "../utils";
import { checkPerm, Permission } from "../core/";
import { toTrim } from "../utils/message";

interface ICommandOptions {
  perm?: Permission,
  vague?: boolean // 是否开启模糊匹配，表示正则表达式匹配，todo：暂不支持含特殊字符的模糊匹配
}

function on_command(command: string, options: ICommandOptions = {}) {
  return function (target: any, name: any, descriptor: any) {
    const oldValue = descriptor.value
    oldValue.isCommand = true
    oldValue.command = command
    descriptor.value = function (event: any, data: ICqMessageResponseGroup | ICqMessageResponsePrivate) {
      let message = data.message
      if (typeof data.message === 'string') {
        message = cqStrToArr(data.message).message
      } else {
        message = toTrim(data.message)
      }
      if (data.message_type === 'private') {
        if (checkPerm(this.$bot, data, options.perm)) {
          if (message[0].type === 'text') {
            // 表示command
            const text = message[0].data.text
            if (text == command) {
              if (typeof text === 'string') {
                return oldValue.apply(this, [event, data, message])
              }
            }
          }
        }
      }

      if (data.message_type === 'group') {
        if (checkPerm(this.$bot, data, options.perm)) {
          if (message[0].type === 'text') {
            // 表示command
            const text = message[0].data.text
            if (text == command) {
              if (typeof text === 'string') {
                return oldValue.apply(this, [event, data, message])
              }
            }
            if (options.vague) {
              const reg = new RegExp(`^${command}(?=\\s)`)
              if (reg.test(text)) {
                // 把匹配到的指令去掉
                const _message = JSON.parse(JSON.stringify(message))
                _message[0].data.text = text.replace(reg, '').trim()
                return oldValue.apply(this, [event, data, _message])
              }
            }
          }
        }

        if (message[0].type === 'at'  && message[0].data.qq == this.$bot.config.qq && message.length > 1) {
          // 表示是艾特
          // 第二个数组的内容为command
          if (message[1].type === 'text') {
            const text = message[1].data.text
            if (isEqualStr(text, command)) {
              if (typeof text === 'string') {
                return oldValue.apply(this, [event, data, message.slice(1, message.length)])
              }
            }
          }
        }

      }

    }
    return descriptor
  }
}

function plugify(target: any) {
  target.isPlugin = true
}

// 表示这个类作为一个服务, 进行统一管理
function toService(target: any) {
  target.isService = true
}

export {
  plugify,
  on_command,
  toService
}
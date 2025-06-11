import { ErrorFactory } from '../errors'
import { MethodMap } from '../base'

// POST
// 列出文件目录
// export type APIDiskListDir = {
//   endpoint: '/api/disk/fs/list'
//   method: MethodMap.POST
//   query: {
//     path: string,
//     password?: string,
//     page?: number,
//     per_page?: number,
//     refresh?: boolean,
//   },
//   response: {
//     data: {
//       content: Array<{
//         name: string,
//         size: number,
//         is_dir: boolean,
//         modified: string,
//         created: string,
//         sign: string,
//         thumb: string,
//         type: number,
//         hashinfo: string,
//         hash_info: null | string,
//       }>,
//       total: number,
//       readme: string,
//       header: string,
//       write: boolean,
//       provider: string,
//     }
//   }
// }


export interface FsGet {
  code: number;
  message: string;
  data: {
    name: string;
    size: number;
    is_dir: boolean;
    modified: string;
    created: string;
    sign: string;
    thumb: string;
    type: number;
    hashinfo: string;
    hash_info: null;
    raw_url: string;
    readme: string;
    header: string;
    provider: string;
    related: null;
  };
}

export interface DirList {
  code: number;
  message: string;
  data: {
    content: {
      name: string;
      size: number;
      is_dir: boolean;
      modified: string;
      created: string;
      sign: string;
      thumb: string;
      type: number;
      hashinfo: string;
      hash_info: null;
    }[];
    total: number;
    readme: string;
    header: string;
    write: boolean;
    provider: string;
  };
}
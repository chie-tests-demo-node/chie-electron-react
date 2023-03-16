interface IProgram {
    svcVersion: string;
    viewVersion: string;
    svchash: string;
    svcName: IProgramName;
    exeName: IProgramName;
    websocketUrl: string;
}

interface IProgramName {
    win: string;
    other: string;
}

export interface IPackageConfig {
    program: IProgram
}
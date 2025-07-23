import { ScreenCapturerResult, SnapshotHashing } from "../../../types";
export declare class DHash implements SnapshotHashing {
    private bits;
    constructor(bits?: number);
    hashSnapshot(screenCapture: ScreenCapturerResult): Promise<string | undefined>;
    private calculateDHash;
    private readPNG;
    private createGrayscaleGrid;
    calculateSnapshotDistance(snapshot1: string, snapshot2: string): number;
    areSnapshotsSimilar(snapshot1: string, snapshot2: string): boolean;
}

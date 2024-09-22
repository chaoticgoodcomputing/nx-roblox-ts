export enum ProvidedRbxtsTemplateEnum {
  PLACE = "place",
  PACKAGE = "package",
  MODEL = "model"
}

export interface PlaceGeneratorSchema {
  projectType: ProvidedRbxtsTemplateEnum
  name: string;
  dir: string;
}

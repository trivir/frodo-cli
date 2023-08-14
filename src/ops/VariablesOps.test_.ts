import * as VariablesOps from './VariablesOps';
import {FullExportInterface} from "../../../frodo-lib/types/ops/OpsTypes";
import {isESVUsed} from "./VariablesOps";

describe('VariablesOps - isESVUsed()', () => {
  const exportObject: FullExportInterface = {
    agents: {},
    application: {},
    config: {
      obj1: {
        obj2: [
          {
            obj3: "",
            obj4: "esv.test.var2"
          },
          {
            obj5: "const a = 'test-var3'; console.log(`&{esv.${a.replaceAll('-', '.')}}`);",
            obj6: "const a = 'test-var4'; console.log('&{esv.' + a + '}');",
            obj7: "//esv-test-var5 does not exist, neither does theesv.test.var6either, but esv.test.var7 does"
          }
        ]
      }
    },
    emailTemplate: {},
    idp: {},
    policy: {},
    policyset: {},
    resourcetype: {},
    saml: {
      hosted: {},
      remote: {},
      metadata: {},
      cot: {},
    },
    script: {
      script1: {
        _id: "12",
        name: "script1",
        default: true,
        language: "JAVASCRIPT",
        context: "SOCIAL_IDP_PROFILE_TRANSFORMATION",
        description: "test script 1",
        script: [
          "This",
          "is",
          "a",
          "very &{esv.test.variable} cool",
          "test"
        ],
        createdBy: "user",
        creationDate: 1433147666269,
        lastModifiedBy: "user",
        lastModifiedDate: 1433147666269
      },
      script2: {
        _id: "34",
        name: "script2",
        default: true,
        language: "JAVASCRIPT",
        context: "SOCIAL_IDP_PROFILE_TRANSFORMATION",
        description: "test script 2",
        script: [],
        createdBy: "user",
        creationDate: 1433147666269,
        lastModifiedBy: "user",
        lastModifiedDate: 1433147666269
      },
      script3: {
        _id: "56",
        name: "script3",
        default: true,
        language: "JAVASCRIPT",
        context: "SOCIAL_IDP_PROFILE_TRANSFORMATION",
        description: "test script 3",
        script: "",
        createdBy: null,
        creationDate: 1433147666269,
        lastModifiedBy: null,
        lastModifiedDate: 1433147666269
      },
      script4: {
        _id: "78",
        name: "script4",
        default: true,
        language: "JAVASCRIPT",
        context: "SOCIAL_IDP_PROFILE_TRANSFORMATION",
        description: "test script 4",
        script: "This\nis\na\n`${systemEnv.getProperty(\"esv.test.var\")}`\ntest",
        createdBy: "user",
        creationDate: 1433147666269,
        lastModifiedBy: "user",
        lastModifiedDate: 1433147666269
      }
    },
    service: {},
    theme: {},
    trees: {},
  }

  test('isESVUsed() 0: Method is implemented', async () => {
    expect(VariablesOps.isESVUsed).toBeDefined();
  });

  test('isESVUsed() 1: Correctly determines that esvs are or are not being used', async () => {
    expect(isESVUsed(exportObject, 'esv-test-var')).toStrictEqual({
      used: true,
      location: 'script.script4.script'
    });
    expect(isESVUsed(exportObject, 'esv-test-variable')).toStrictEqual({
      used: true,
      location: 'script.script1.script.3'
    });
    expect(isESVUsed(exportObject, 'esv-test-va')).toStrictEqual({
      used: false,
      location: ''
    });
    expect(isESVUsed(exportObject, 'esv-test-var2')).toStrictEqual({
      used: true,
      location: 'config.obj1.obj2.0.obj4'
    });
    expect(isESVUsed(exportObject, 'esv-test-var3')).toStrictEqual({
      used: false,
      location: ''
    });
    expect(isESVUsed(exportObject, 'esv-test-var4')).toStrictEqual({
      used: false,
      location: ''
    });
    expect(isESVUsed(exportObject, 'esv-test-var5')).toStrictEqual({
      used: false,
      location: ''
    });
    expect(isESVUsed(exportObject, 'esv-test-var6')).toStrictEqual({
      used: false,
      location: ''
    });
    expect(isESVUsed(exportObject, 'esv-test-var7')).toStrictEqual({
      used: true,
      location: 'config.obj1.obj2.1.obj7'
    });
    expect(isESVUsed(exportObject, 'esv-test-var8')).toStrictEqual({
      used: false,
      location: ''
    });
  });
});

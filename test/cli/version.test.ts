import { cli } from "../../src/cli";

it("test version", async () => {
  jest.replaceProperty(process, "argv", [...process.argv.slice(0, 2), "-v"]);

  await cli();
});

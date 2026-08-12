import * as mammoth from "mammoth";
import * as fs from "fs";

async function run() {
  const buffer = fs.readFileSync("/mnt/user-uploads/Espetinho_na_Veia_Importacao_Lovable_Leve.docx");
  const result = await mammoth.convertToHtml({ buffer });
  const html = result.value;
  console.log("---HTML_START---");
  console.log(html);
  console.log("---HTML_END---");
}

run().catch(console.error);

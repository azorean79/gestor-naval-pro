const fs = require("fs");
let code = fs.readFileSync("src/app/agenda/page.tsx", "utf8");

if (!code.includes("import Link from \"next/link\"")) {
    code = code.replace(/import React/, "import Link from \"next/link\";\nimport React");
}

code = code.replace(
    /raftSerial: string;/,
    "raftSerial: string;\n  raftId?: string | number;"
);

code = code.replace(
    /const raftSerial = ev.raftSerial \|\| ev.title\?\.split\("\("\)\[1\]\?\.replace\("\)", ""\) \|\| "";/,
    "const raftSerial = ev.raftSerial || ev.title?.split(\"(\")[1]?.replace(\")\", \"\") || \"\";\n          const raftId = raftsRef.current.find((item) => item.serial === raftSerial)?.id;"
);

code = code.replace(
    /raftSerial: ev.raftSerial \|\| raftSerial,/,
    "raftSerial: ev.raftSerial || raftSerial,\n              raftId: ev.raftId || raftId,"
);

const beforeTD = `<td className="px-3 py-2 font-medium text-gray-900">{ev.raftSerial}</td>`;
const afterTD = `<td className="px-3 py-2 font-medium text-gray-900">
                                {ev.raftId ? (
                                  <Link href={\`/jangadas/\${ev.raftId}\`} className="text-blue-700 hover:underline">
                                    {ev.raftSerial}
                                  </Link>
                                ) : (
                                  ev.raftSerial
                                )}
                              </td>`;

code = code.replace(beforeTD, afterTD);

fs.writeFileSync("src/app/agenda/page.tsx", code, "utf8");
console.log("Done agenda!");

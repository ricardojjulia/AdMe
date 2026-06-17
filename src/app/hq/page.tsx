import fs from 'fs';
import path from 'path';
import { ClientHq } from './ClientHq';

export const dynamic = 'force-dynamic';

export default async function HqPage() {
  const decisionsDir = path.resolve('docs/decisions');
  let initialDecisions: Array<{ name: string; path: string; content: string }> = [];

  try {
    if (fs.existsSync(decisionsDir)) {
      const files = fs.readdirSync(decisionsDir).filter((f) => f.endsWith('.md'));
      initialDecisions = files.map((file) => {
        const filePath = path.join(decisionsDir, file);
        const content = fs.readFileSync(filePath, 'utf8');
        return {
          name: file,
          path: filePath,
          content,
        };
      });
    }
  } catch (error) {
    console.error("Error reading decisions registry directory:", error);
  }

  return <ClientHq initialDecisions={initialDecisions} />;
}

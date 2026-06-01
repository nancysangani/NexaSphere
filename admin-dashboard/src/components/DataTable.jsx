import { exportToCSV } from '../utils/exportCSV';
import { exportToPDF } from '../utils/exportPDF';
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="outline">Export ▾</Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem onClick={() => exportToCSV(tableData, tableName)}>
      📄 Export as CSV
    </DropdownMenuItem>
    <DropdownMenuItem onClick={() => exportToPDF(columns, tableData, tableName)}>
      🖨️ Export as PDF
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
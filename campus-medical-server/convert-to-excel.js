const fs = require('fs');
const xlsx = require('xlsx');

const mdContent = fs.readFileSync('test-cases-and-defects.md', 'utf-8');

function parseTestCases(content) {
  const testCases = [];
  const lines = content.split('\n');
  
  let currentModule = '';
  let currentTC = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line.startsWith('### 模块')) {
      currentModule = line.replace('### ', '');
    } else if (line.startsWith('#### TC-')) {
      if (currentTC) {
        testCases.push(currentTC);
      }
      currentTC = {
        module: currentModule,
        id: line.replace('#### ', '').split('：')[0],
        title: line.replace('#### ', '').split('：')[1] || '',
        preconditions: '',
        steps: '',
        expected: ''
      };
    } else if (currentTC) {
      if (line.startsWith('**前置条件**：')) {
        currentTC.preconditions = line.replace('**前置条件**：', '');
      } else if (line.startsWith('**测试步骤**：')) {
        currentTC.steps = line.replace('**测试步骤**：', '');
        i++;
        while (i < lines.length && !lines[i].startsWith('**') && lines[i].trim()) {
          currentTC.steps += '\n' + lines[i].trim();
          i++;
        }
        i--;
      } else if (line.startsWith('**预期结果**：')) {
        currentTC.expected = line.replace('**预期结果**：', '');
        i++;
        while (i < lines.length && !lines[i].startsWith('**') && lines[i].trim()) {
          currentTC.expected += '\n' + lines[i].trim();
          i++;
        }
        i--;
      }
    }
  }
  
  if (currentTC) {
    testCases.push(currentTC);
  }
  
  return testCases;
}

function parseDefects(content) {
  const defects = [];
  const lines = content.split('\n');
  
  let currentDefect = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line.startsWith('### DEF-')) {
      if (currentDefect) {
        defects.push(currentDefect);
      }
      const parts = line.replace('### ', '').split('：');
      currentDefect = {
        id: parts[0],
        title: parts.slice(1).join('：') || '',
        description: '',
        impact: '',
        location: '',
        code: '',
        suggestion: '',
        status: '待修复'
      };
    } else if (currentDefect) {
      if (line.startsWith('**问题描述**：')) {
        currentDefect.description = line.replace('**问题描述**：', '');
        i++;
        while (i < lines.length && !lines[i].startsWith('**') && lines[i].trim()) {
          currentDefect.description += '\n' + lines[i].trim();
          i++;
        }
        i--;
      } else if (line.startsWith('**影响范围**：')) {
        currentDefect.impact = line.replace('**影响范围**：', '');
        i++;
        while (i < lines.length && !lines[i].startsWith('**') && lines[i].trim()) {
          currentDefect.impact += '\n' + lines[i].trim();
          i++;
        }
        i--;
      } else if (line.startsWith('**代码位置**：')) {
        currentDefect.location = line.replace('**代码位置**：', '');
      } else if (line.startsWith('**修复方案**：')) {
        currentDefect.suggestion = line.replace('**修复方案**：', '');
        i++;
        while (i < lines.length && !lines[i].startsWith('**') && lines[i].trim()) {
          currentDefect.suggestion += '\n' + lines[i].trim();
          i++;
        }
        i--;
      } else if (line.startsWith('**修复建议**：')) {
        currentDefect.suggestion = line.replace('**修复建议**：', '');
        i++;
        while (i < lines.length && !lines[i].startsWith('**') && lines[i].trim()) {
          currentDefect.suggestion += '\n' + lines[i].trim();
          i++;
        }
        i--;
      } else if (line.startsWith('**修复状态**：')) {
        currentDefect.status = line.replace('**修复状态**：', '');
      } else if (line.startsWith('```javascript')) {
        currentDefect.code = '';
        i++;
        while (i < lines.length && !lines[i].startsWith('```')) {
          currentDefect.code += lines[i] + '\n';
          i++;
        }
      } else if (line.startsWith('```')) {
        currentDefect.code = line.replace('```', '');
        i++;
        while (i < lines.length && !lines[i].startsWith('```')) {
          currentDefect.code += lines[i] + '\n';
          i++;
        }
      }
    }
  }
  
  if (currentDefect) {
    defects.push(currentDefect);
  }
  
  return defects;
}

const testCases = parseTestCases(mdContent);
const defects = parseDefects(mdContent);

const wb = xlsx.utils.book_new();

const tcHeaders = ['模块', '用例ID', '用例名称', '前置条件', '测试步骤', '预期结果'];
const tcData = testCases.map(tc => [
  tc.module,
  tc.id,
  tc.title,
  tc.preconditions,
  tc.steps,
  tc.expected
]);
const tcWs = xlsx.utils.aoa_to_sheet([tcHeaders, ...tcData]);
xlsx.utils.book_append_sheet(wb, tcWs, '测试用例');

const defectHeaders = ['缺陷ID', '缺陷标题', '问题描述', '影响范围', '代码位置', '代码示例', '修复建议', '修复状态'];
const defectData = defects.map(d => [
  d.id,
  d.title,
  d.description,
  d.impact,
  d.location,
  d.code,
  d.suggestion,
  d.status
]);
const defectWs = xlsx.utils.aoa_to_sheet([defectHeaders, ...defectData]);
xlsx.utils.book_append_sheet(wb, defectWs, '缺陷报告');

tcWs['!cols'] = [
  { wch: 20 },
  { wch: 15 },
  { wch: 30 },
  { wch: 40 },
  { wch: 60 },
  { wch: 60 }
];

defectWs['!cols'] = [
  { wch: 15 },
  { wch: 30 },
  { wch: 50 },
  { wch: 40 },
  { wch: 40 },
  { wch: 60 },
  { wch: 50 },
  { wch: 15 }
];

xlsx.writeFile(wb, 'test-cases-and-defects.xlsx');

console.log('Excel 文件已生成：test-cases-and-defects.xlsx');
console.log(`测试用例：${testCases.length} 条`);
console.log(`缺陷报告：${defects.length} 条`);
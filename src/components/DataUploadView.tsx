/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from 'react';
import { useState, useRef } from 'react';
import { 
  Upload, 
  FileImage, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  BrainCircuit,
  Database,
  FileText,
  FileSpreadsheet,
  File as FileIcon,
  MessageSquare,
  ClipboardPaste
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Type } from "@google/genai";
import { apiService } from '../lib/apiService';
import { Student, Teacher, BatchConfig } from '../types';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { apiService } from '../lib/apiService';

interface DataUploadViewProps {
  onDataExtracted: (students: Student[]) => void;
  teachers: Teacher[];
  defaultBatch?: string;
}

export function DataUploadView({ onDataExtracted, teachers, defaultBatch }: DataUploadViewProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileType, setFileType] = useState<'image' | 'pdf' | 'excel' | 'other'>('other');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [progress, setProgress] = useState(0);
  const [extractedStudents, setExtractedStudents] = useState<Student[]>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
  const [selectedBatch, setSelectedBatch] = useState<string>('');
  const [uploadMode, setUploadMode] = useState<'file' | 'text'>('file');
  const [pastedText, setPastedText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      
      if (selectedFile.type.startsWith('image/')) {
        setFileType('image');
        const reader = new FileReader();
        reader.onloadend = () => setPreview(reader.result as string);
        reader.readAsDataURL(selectedFile);
      } else if (selectedFile.type === 'application/pdf') {
        setFileType('pdf');
        setPreview(null);
      } else if (
        selectedFile.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
        selectedFile.type === 'application/vnd.ms-excel' ||
        selectedFile.name.endsWith('.csv')
      ) {
        setFileType('excel');
        setPreview(null);
      } else {
        setFileType('other');
        setPreview(null);
      }
    }
  };

  const clearFile = () => {
    setFile(null);
    setPreview(null);
    setFileType('other');
    setProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const processFile = async () => {
    if (uploadMode === 'file' && !file) return;
    if (uploadMode === 'text' && !pastedText) return;

    setIsProcessing(true);
    setProgress(10);

    try {
      let parts: any[] = [];

      const prompt = `
        You are an expert at reading student data from images, PDFs, spreadsheets, or raw text.
        Your task is to extract student information and return it as a JSON array.
        
        STRICT BATCH MAPPING:
        - If the batch is "A" or "Batch A", use "2024-A"
        - If the batch is "B" or "Batch B", use "2024-B"
        - If the batch is "C" or "Batch C", use "2024-C"
        - Otherwise, use the batch as written in the document.
        
        DATA STRUCTURE:
        For each student, extract:
        - name: Full name
        - rollNo: Roll number or ID
        - batch: Use the mapping above (2024-A, 2024-B, or 2024-C)
        - branch: Department (CS, ME, etc.)
        - preAnalysis: Object with communication, technical, logic, confidence (0-10)
        - postAnalysis: Object with communication, technical, logic, confidence (0-10)
        - workshopScores: Array of { activityId, marks, attendance, date }
        
        If scores are missing, use 0. If attendance is missing, use "Absent".
        If ONLY names are present, still create the student objects with default values for other fields.
        
        Return ONLY a JSON array.
      `;

      setProgress(20);

      if (uploadMode === 'text') {
        parts = [prompt, pastedText];
      } else if (fileType === 'image' || fileType === 'pdf') {
        const base64Data = await readFileAsBase64(file);
        parts = [
          { text: prompt },
          { inlineData: { mimeType: file.type, data: base64Data } }
        ];
      } else if (fileType === 'excel') {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer);
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const csvData = XLSX.utils.sheet_to_csv(worksheet);
        
        parts = [
          { text: prompt + "\n\nCSV Data:\n" + csvData }
        ];
      } else {
        const text = await file.text();
        parts = [
          { text: prompt + "\n\nRaw Text:\n" + text }
        ];
      }

      setProgress(40);

      const response = await apiService.generateAIContent({
        model: "gemini-3-flash-preview",
        contents: { parts },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                rollNo: { type: Type.STRING },
                batch: { type: Type.STRING },
                branch: { type: Type.STRING },
                preAnalysis: {
                  type: Type.OBJECT,
                  properties: {
                    communication: { type: Type.NUMBER },
                    technical: { type: Type.NUMBER },
                    logic: { type: Type.NUMBER },
                    confidence: { type: Type.NUMBER }
                  },
                  required: ["communication", "technical", "logic", "confidence"]
                },
                postAnalysis: {
                  type: Type.OBJECT,
                  properties: {
                    communication: { type: Type.NUMBER },
                    technical: { type: Type.NUMBER },
                    logic: { type: Type.NUMBER },
                    confidence: { type: Type.NUMBER }
                  },
                  required: ["communication", "technical", "logic", "confidence"]
                },
                workshopScores: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      activityId: { type: Type.STRING },
                      marks: { type: Type.NUMBER },
                      attendance: { type: Type.STRING, enum: ["Present", "Absent"] },
                      date: { type: Type.STRING }
                    },
                    required: ["activityId", "marks", "attendance", "date"]
                  }
                }
              },
              required: ["name", "rollNo", "batch", "branch", "preAnalysis", "postAnalysis", "workshopScores"]
            }
          }
        }
      });

      setProgress(80);

      const extractedData = JSON.parse(response.text);
      console.log('Extracted Data:', extractedData);
      
      if (!Array.isArray(extractedData) || extractedData.length === 0) {
        throw new Error("No student data could be extracted from this file. Please ensure the file contains a list of students.");
      }

      const processedData = extractedData.map((s: any) => ({
        ...s,
        id: s.rollNo || Math.random().toString(36).substr(2, 9)
      }));

      setProgress(100);
      setExtractedStudents(processedData);
      if (processedData.length > 0 && processedData[0].batch) {
        setSelectedBatch(processedData[0].batch);
      }
      toast.success(`Extracted ${extractedData.length} students. Please review and assign a teacher.`);
      
    } catch (error) {
      console.error('Error processing file:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to process file.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFinalize = async () => {
    if (!selectedTeacherId) {
      toast.error("Please select a counselor to assign this batch.");
      return;
    }

    if (!selectedBatch) {
      toast.error("Please specify the batch ID.");
      return;
    }

    setIsSaving(true);
    try {
      const teacher = teachers.find(t => t.id === selectedTeacherId);
      if (!teacher) throw new Error("Selected teacher not found.");

      const studentsToSave = extractedStudents.map(s => ({
        ...s,
        teacherId: selectedTeacherId,
        batch: selectedBatch
      }));

      // Cloud Sync
      await apiService.saveStudents(studentsToSave);
      
      const batchConfig: BatchConfig = {
        batchId: selectedBatch,
        teacherId: selectedTeacherId,
        teacherName: teacher.name,
        isSetupComplete: true,
        studentCount: studentsToSave.length,
        updatedAt: new Date().toISOString()
      };
      
      await apiService.saveBatchConfig(batchConfig);
      
      await apiService.addAuditLog({
        action: `Admin finalized Batch ${selectedBatch} with ${studentsToSave.length} students assigned to Prof. ${teacher.name}.`,
        performedBy: 'SKIT Admin',
        timestamp: new Date().toISOString()
      });

      toast.success("Batch finalized and synced to cloud!");
      onDataExtracted(studentsToSave);
    } catch (error) {
      console.error("Error finalizing batch:", error);
      toast.error("Failed to sync data to cloud.");
    } finally {
      setIsSaving(false);
    }
  };

  const getFileIcon = () => {
    switch (fileType) {
      case 'image': return <FileImage className="w-12 h-12 text-blue-500" />;
      case 'pdf': return <FileText className="w-12 h-12 text-red-500" />;
      case 'excel': return <FileSpreadsheet className="w-12 h-12 text-emerald-500" />;
      default: return <FileIcon className="w-12 h-12 text-slate-400" />;
    }
  };

  return (
    <div className="w-full space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">AI Data Integration</h1>
          <p className="text-slate-500 mt-1">Upload images, PDFs, or Excel sheets to automatically sync student records</p>
        </div>
        <div className="p-3 bg-indigo-50 rounded-2xl">
          <BrainCircuit className="w-8 h-8 text-indigo-600" />
        </div>
      </div>

      <AnimatePresence mode="wait">
        {extractedStudents.length > 0 ? (
          <motion.div 
            key="preview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full space-y-6"
          >
            <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
              <CardHeader className="bg-slate-50/50 flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Data Preview & Assignment</CardTitle>
                  <CardDescription>Review extracted data and assign a teacher</CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setExtractedStudents([])} className="text-slate-400">
                  <X className="w-4 h-4 mr-2" /> Start Over
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 border-b border-slate-100">
                  <div className="space-y-2">
                    <Label className="text-sm font-bold">Target Batch ID</Label>
                    <Select value={selectedBatch} onValueChange={setSelectedBatch}>
                      <SelectTrigger className="rounded-xl h-12">
                        <SelectValue placeholder="Select Batch" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2024-A">2024-A</SelectItem>
                        <SelectItem value="2024-B">2024-B</SelectItem>
                        <SelectItem value="2024-C">2024-C</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-bold">Assign to Counselor (Teacher)</Label>
                    <Select value={selectedTeacherId} onValueChange={setSelectedTeacherId}>
                      <SelectTrigger className="rounded-xl h-12">
                        <SelectValue placeholder="Select Teacher" />
                      </SelectTrigger>
                      <SelectContent>
                        {teachers.filter(t => t.role === 'Teacher').map(t => (
                          <SelectItem key={t.id} value={t.id}>Prof. {t.name} ({t.department})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="max-h-[400px] overflow-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-white z-10 shadow-sm">
                      <TableRow>
                        <TableHead>Roll No</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Branch</TableHead>
                        <TableHead>Scores (P/T/L/C)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {extractedStudents.map((s) => (
                        <TableRow key={s.id}>
                          <TableCell className="font-bold">{s.rollNo}</TableCell>
                          <TableCell>{s.name}</TableCell>
                          <TableCell>{s.branch}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <span className="text-xs bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded">{s.preAnalysis.communication}</span>
                              <span className="text-xs bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded">{s.preAnalysis.technical}</span>
                              <span className="text-xs bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded">{s.preAnalysis.logic}</span>
                              <span className="text-xs bg-rose-50 text-rose-600 px-1.5 py-0.5 rounded">{s.preAnalysis.confidence}</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                
                <div className="p-6 bg-slate-50 flex justify-end items-center gap-4">
                  <p className="text-sm text-slate-500 mr-auto">
                    Total Students: <span className="font-bold text-slate-900">{extractedStudents.length}</span>
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={() => setExtractedStudents([])}
                  >
                    Cancel
                  </Button>
                  <Button 
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 h-12 rounded-xl flex items-center gap-2"
                    onClick={handleFinalize}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Saving to Cloud...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-5 h-5" />
                        Finalize & Assign
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full">
            <Card className="lg:col-span-2 border-none shadow-sm bg-white rounded-3xl overflow-hidden">
          <CardHeader className="bg-slate-50/50 pb-6 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">Student Input</CardTitle>
                <CardDescription>Upload files or paste raw data</CardDescription>
              </div>
              <Tabs value={uploadMode} onValueChange={(v) => setUploadMode(v as any)} className="w-[300px]">
                <TabsList className="grid w-full grid-cols-2 rounded-xl">
                  <TabsTrigger value="file" className="rounded-lg">File Upload</TabsTrigger>
                  <TabsTrigger value="text" className="rounded-lg">Paste Text</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent className="p-8">
            {uploadMode === 'file' ? (
              <div 
                className={`
                  relative border-2 border-dashed rounded-3xl p-12 transition-all duration-300
                  ${file ? 'border-indigo-300 bg-indigo-50/20' : 'border-slate-200 hover:border-indigo-400 hover:bg-slate-50/50'}
                  flex flex-col items-center justify-center text-center min-h-[400px]
                `}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const droppedFile = e.dataTransfer.files[0];
                  if (droppedFile) {
                    const event = { target: { files: [droppedFile] } } as any;
                    handleFileChange(event);
                  }
                }}
              >
                {file ? (
                  <div className="relative w-full h-full flex flex-col items-center">
                    {preview ? (
                      <img 
                        src={preview} 
                        alt="Preview" 
                        className="max-h-[250px] rounded-2xl shadow-xl mb-6 object-contain"
                      />
                    ) : (
                      <div className="mb-6 p-8 bg-white rounded-3xl shadow-md border border-slate-100">
                        {getFileIcon()}
                      </div>
                    )}
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="absolute -top-4 -right-4 bg-white shadow-lg rounded-full hover:bg-rose-50 hover:text-rose-600 border border-slate-100"
                      onClick={clearFile}
                    >
                      <X className="w-5 h-5" />
                    </Button>
                    <p className="text-lg text-slate-900 font-bold truncate max-w-[300px]">{file.name}</p>
                    <p className="text-sm text-slate-500 mt-1 font-medium italic">{(file.size / 1024 / 1024).toFixed(2)} MB • Ready for AI Audit</p>
                  </div>
                ) : (
                  <>
                    <div className="w-20 h-20 bg-indigo-100 rounded-3xl flex items-center justify-center mb-6 shadow-pill">
                      <Upload className="w-10 h-10 text-indigo-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-2">Drag & Drop Batch List</h3>
                    <p className="text-slate-500 mb-8 px-8 max-w-md">Our integrated AI models can read data from printed sheets, handwriting, and complex spreadsheets. No template required.</p>
                    <Button 
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl px-12 h-14 font-black shadow-lg shadow-indigo-100 transition-all hover:scale-105"
                    >
                      Select Files From Computer
                    </Button>
                  </>
                )}
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*,.pdf,.xlsx,.xls,.csv"
                  onChange={handleFileChange}
                />
              </div>
            ) : (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-2 text-indigo-700 font-bold px-2">
                  <ClipboardPaste className="w-5 h-5" />
                  <h4>Manual Entry / Paste</h4>
                </div>
                <Textarea 
                  placeholder="Paste student roll numbers, names, or any raw text data here. Our AI will automatically organize it into the audit format.&#10;&#10;e.g.&#10;101 Rahul Sharma CS 8 9 7 9&#10;102 Priya Verma ME 7 7 8 6"
                  className="min-h-[400px] rounded-3xl border-2 border-slate-100 focus:border-indigo-400 p-6 font-mono text-sm shadow-inner transition-all"
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                />
                <div className="flex items-center gap-3 p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                  <BrainCircuit className="w-6 h-6 text-indigo-600 shrink-0" />
                  <p className="text-xs text-indigo-800 leading-relaxed font-medium">
                    Tip: You don't need a specific format. Even unorganized text like "Add Rahul Roll 23 to Batch A" works perfectly with Gemini Pro.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white rounded-3xl h-full">
          <CardHeader>
            <CardTitle className="text-xl">AI Processing Status</CardTitle>
            <CardDescription>Real-time extraction & integration progress</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex justify-between text-sm font-medium">
                <span className="text-slate-500">Extraction Progress</span>
                <span className="text-indigo-600">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2 bg-slate-100" />
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Capabilities</h4>
              <div className="grid grid-cols-1 gap-3">
                <CapabilityItem 
                  icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                  text="Handwritten & Printed OCR"
                />
                <CapabilityItem 
                  icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                  text="PDF & Document Analysis"
                />
                <CapabilityItem 
                  icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                  text="Spreadsheet Data Extraction"
                />
                <CapabilityItem 
                  icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                  text="Automatic Schema Mapping"
                />
              </div>
            </div>

            <div className="pt-4">
              <Button 
                disabled={(uploadMode === 'file' ? !file : !pastedText) || isProcessing}
                onClick={processFile}
                className="w-full h-16 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xl rounded-2xl shadow-lg shadow-indigo-100 flex items-center justify-center gap-3 transition-all duration-200 hover:scale-[1.02] active:scale-95"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-7 h-7 animate-spin" />
                    Our AI is Reading...
                  </>
                ) : (
                  <>
                    <Database className="w-7 h-7" />
                    Process Data
                  </>
                )}
              </Button>
            </div>

            {isProcessing && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-3 p-4 bg-amber-50 rounded-2xl border border-amber-100"
              >
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                <p className="text-xs text-amber-700 leading-relaxed">
                  Our AI is analysing the file content. For large PDFs or complex spreadsheets, this may take a few moments.
                </p>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </div>
    )}
    </AnimatePresence>
  </div>
  );
}

function CapabilityItem({ icon, text }: { icon: React.ReactNode, text: string }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
      {icon}
      <span className="text-sm text-slate-700 font-medium">{text}</span>
    </div>
  );
}

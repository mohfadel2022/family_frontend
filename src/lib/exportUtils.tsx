import * as XLSX from 'xlsx';
import { pdf, Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import React from 'react';

// Register elegant Arabic font
Font.register({
    family: 'Almarai',
    src: 'https://raw.githubusercontent.com/google/fonts/main/ofl/almarai/Almarai-Regular.ttf'
});
Font.register({
    family: 'AlmaraiBold',
    src: 'https://raw.githubusercontent.com/google/fonts/main/ofl/almarai/Almarai-Bold.ttf'
});

const pdfStyles = StyleSheet.create({
    page: {
        padding: 30, // Slightly reduced padding
        fontFamily: 'Almarai',
        backgroundColor: '#ffffff',
    },
    header: {
        marginBottom: 15,
        borderBottomWidth: 2,
        borderBottomColor: '#3b82f6',
        paddingBottom: 10,
        flexDirection: 'row-reverse',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    companyInfo: {
        flexDirection: 'column',
        alignItems: 'flex-end', // Align to right for Arabic
    },
    companyName: {
        fontSize: 14,
        fontFamily: 'AlmaraiBold',
        color: '#1e293b',
    },
    reportTitleContainer: {
        alignItems: 'center',
        flex: 1,
    },
    reportTitle: {
        fontSize: 20,
        fontFamily: 'AlmaraiBold',
        color: '#2563eb',
        textAlign: 'center',
    },
    reportSubtitle: {
        fontSize: 11,
        color: '#64748b',
        fontFamily: 'AlmaraiBold',
        marginTop: 2,
        textAlign: 'center',
    },
    metaInfo: {
        fontSize: 8,
        color: '#64748b',
        marginTop: 3,
        textAlign: 'left',
    },
    table: {
        width: '100%',
        marginTop: 10,
    },
    tableHeader: {
        backgroundColor: '#f1f5f9',
        borderBottomWidth: 2,
        borderBottomColor: '#2563eb',
        flexDirection: 'row-reverse',
        minHeight: 25,
        alignItems: 'center',
    },
    tableRow: {
        flexDirection: 'row-reverse',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
        minHeight: 22,
        alignItems: 'center',
    },
    tableCol: {
        padding: 5,
    },
    tableHeaderText: {
        color: '#1e293b',
        fontSize: 9,
        fontFamily: 'AlmaraiBold',
        textAlign: 'right',
    },
    tableCellText: {
        fontSize: 8,
        textAlign: 'right',
        color: '#334155',
        lineHeight: 1.3,
    },
    footer: {
        position: 'absolute',
        bottom: 20,
        left: 30,
        right: 30,
        borderTopWidth: 1,
        borderTopColor: '#e2e8f0',
        paddingTop: 8,
        flexDirection: 'row-reverse',
        justifyContent: 'space-between',
    },
    footerText: {
        fontSize: 7,
        color: '#94a3b8',
    }
});

const MyPdfDocument = ({ title, subtitle, headers, data }: { title: string, subtitle?: string, headers: string[], data: any[][] }) => {
    const today = new Date().toLocaleString('ar-EG', {
        year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });

    return (
        <Document>
            <Page size="A4" orientation="landscape" style={pdfStyles.page}>
                {/* Professional Header */}
                <View style={pdfStyles.header}>
                    <View style={pdfStyles.companyInfo}>
                        <Text style={pdfStyles.companyName}>نظام العائلة المحاسبي</Text>
                        <Text style={pdfStyles.metaInfo}>تاريخ التقرير: {today}</Text>
                    </View>
                    <View style={pdfStyles.reportTitleContainer}>
                        <Text style={pdfStyles.reportTitle}>{title}</Text>
                        {subtitle && <Text style={pdfStyles.reportSubtitle}>{subtitle}</Text>}
                    </View>
                </View>

                {/* Table Container */}
                <View style={pdfStyles.table}>
                    {/* Header Row - FIXED to repeat on every page */}
                    <View style={pdfStyles.tableHeader} fixed>
                        {headers.map((header, i) => (
                            <View key={i} style={[pdfStyles.tableCol, { flex: i === 1 ? 3 : 1 }]}>
                                <Text style={pdfStyles.tableHeaderText}>{header}</Text>
                            </View>
                        ))}
                    </View>
                    {/* Rows - Prevent rows from wrapping across pages */}
                    {data.map((row, i) => (
                        <View key={i} style={[
                            pdfStyles.tableRow,
                            i % 2 === 0 ? {} : { backgroundColor: '#f9fafb' }
                        ]} wrap={false}>
                            {row.map((cell, j) => (
                                <View key={j} style={[pdfStyles.tableCol, { flex: j === 1 ? 3 : 1 }]}>
                                    <Text style={pdfStyles.tableCellText}>{String(cell ?? '')}</Text>
                                </View>
                            ))}
                        </View>
                    ))}
                </View>

                {/* Footer */}
                <View style={pdfStyles.footer} fixed>
                    <Text style={pdfStyles.footerText}>تقرير مالي رسمي - بنظام العائلة المحاسبي</Text>
                    <Text style={pdfStyles.footerText} render={({ pageNumber, totalPages }) => (
                        `صفحة ${pageNumber} من ${totalPages}`
                    )} />
                </View>
            </Page>
        </Document>
    );
};

export const exportToExcel = (data: any[], filename: string, headers: string[], keys: string[]) => {
    const sheetData = data.map(item => {
        const row: any = {};
        headers.forEach((header, idx) => {
            row[header] = item[keys[idx]];
        });
        return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(sheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');
    XLSX.writeFile(workbook, `${filename}.xlsx`);
};

export const exportToPDF = async (data: any[], filename: string, title: string, headers: string[], keys: string[], subtitle?: string, summary?: any) => {
    const translations: Record<string, string> = {
        'ASSET': 'أصول',
        'LIABILITY': 'خصوم',
        'EQUITY': 'حقوق الملكية',
        'REVENUE': 'إيرادات',
        'EXPENSE': 'مصروفات',
        'Income': 'إيرادات',
        'Expenses': 'مصروفات',
        'Summary': 'الملخص'
    };

    const tableData = data.map(item => keys.map(k => {
        const val = item[k];
        return (typeof val === 'string' && translations[val]) ? translations[val] : val;
    }));

    // If summary is provided, add it as a final row
    if (summary) {
        const summaryRow = keys.map((k, idx) => {
            if (idx === 0) return 'الإجمالي';
            return summary[k] !== undefined ? summary[k] : '';
        });
        tableData.push(summaryRow);
    }

    const blob = await pdf(
        <MyPdfDocument
            title={title}
            subtitle={subtitle}
            headers={headers}
            data={tableData}
        />
    ).toBlob();

    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
};

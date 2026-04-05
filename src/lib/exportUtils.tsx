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
        padding: 30,
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
        alignItems: 'flex-end',
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
        textAlign: 'center',
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
        textAlign: 'center',
    }
});

const MyPdfDocument = ({
    title,
    subtitle,
    headers,
    data,
    sections,
    orientation = 'landscape',
    columnStyles = {},
    columnFlexes = {},
    columnAligns = {},
    filename
}: {
    title?: string,
    subtitle?: string,
    headers?: string[],
    data?: any[][],
    sections?: {
        title: string,
        subtitle?: string,
        headers: string[],
        data: any[][]
    }[],
    orientation?: 'portrait' | 'landscape',
    columnStyles?: Record<number, string>,
    columnFlexes?: Record<number, number>,
    columnAligns?: Record<number, 'left' | 'center' | 'right'>,
    filename?: string
}) => {
    const today = new Date().toLocaleString('ar-AR', {
        year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });

    const renderPage = (pTitle: string, pSubtitle: string | undefined, pHeaders: string[], pData: any[][], keyPrefix: string) => (
        <Page key={keyPrefix} size={orientation === 'landscape' ? [841.89, 595.28] : "A4"} style={pdfStyles.page}>
            <View style={pdfStyles.header}>
                <View style={pdfStyles.companyInfo}>
                    <Text style={pdfStyles.metaInfo}>تاريخ التقرير: {today}</Text>
                </View>
                <View style={pdfStyles.reportTitleContainer}>
                    <Text style={pdfStyles.reportTitle}>{pTitle}</Text>
                    {pSubtitle && <Text style={pdfStyles.reportSubtitle}>{pSubtitle}</Text>}
                </View>
            </View>

            <View style={pdfStyles.table}>
                <View style={pdfStyles.tableHeader} fixed>
                    {pHeaders.map((header, i) => (
                        <View key={i} style={[
                            pdfStyles.tableCol,
                            { flex: columnFlexes[i] || (i === 0 ? 3 : i === pHeaders.length - 1 ? 2 : 1) },
                            columnStyles[i] ? { backgroundColor: columnStyles[i] } : {}
                        ]}>
                            <Text style={[
                                pdfStyles.tableHeaderText, 
                                columnAligns[i] ? { textAlign: columnAligns[i] } : {},
                                columnStyles[i] ? { color: '#ffffff' } : {}
                            ]}>{header}</Text>
                        </View>
                    ))}
                </View>
                {pData.map((row: any, i) => {
                    const rowStyle = row._rowStyle || {};
                    const firstCell = row[0];
                    const firstText = (firstCell && typeof firstCell === 'object') ? (firstCell.text || '') : String(firstCell || '');
                    const isSummaryRow = firstText.includes('إجمالي') || firstText.includes('المجموع') || rowStyle.isSummary;
                    const isBoldRow = isSummaryRow || rowStyle.isBold;
                    const rowBgColor = rowStyle.bgColor || (isSummaryRow ? '' : (i % 2 === 0 ? '' : '#f9fafb'));
                    const rowFont = (isBoldRow ? 'AlmaraiBold' : 'Almarai');

                    return (
                        <View key={i} style={[
                            pdfStyles.tableRow,
                            { backgroundColor: rowBgColor },
                            !isSummaryRow
                                ? { borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }
                                : { borderTopWidth: 1.5, borderTopColor: '#cbd5e1', borderBottomWidth: 1.5, borderBottomColor: '#cbd5e1' }
                        ]} wrap={false}>
                                {row.map((cell: any, j: number) => {
                                    const isObject = cell !== null && typeof cell === 'object' && cell.text !== undefined;
                                    const cellText = isObject ? cell.text : String(cell ?? '');
                                    const cellBg = isObject ? cell.bgColor : (columnStyles[j] && cell !== '-' && cell !== '---' && cell !== null && cell !== undefined ? columnStyles[j] : null);
                                    const colorBox = isObject ? cell.colorBox : null;
                                    const isNameCol = j === 0;

                                    return (
                                        <View key={j} style={[
                                            pdfStyles.tableCol,
                                            { flex: columnFlexes[j] || (j === 0 ? 3 : j === pHeaders.length - 1 ? 2 : 1) },
                                            cellBg ? { backgroundColor: cellBg } : {},
                                            (isNameCol && rowStyle.indent) ? { paddingRight: rowStyle.indent } : {}
                                        ]}>
                                            <View style={{ 
                                                flexDirection: 'row-reverse', 
                                                alignItems: 'center', 
                                                justifyContent: isNameCol ? 'flex-start' : 'center'
                                            }}>
                                                {colorBox && (
                                                    <View style={{ width: 7, height: 7, backgroundColor: colorBox, marginLeft: 4, borderRadius: 1, borderStyle: 'solid', borderWidth: 0.5, borderColor: '#1e293b' }} />
                                                )}
                                                <Text style={[
                                                    pdfStyles.tableCellText,
                                                    isNameCol ? {} : { textAlign: 'center' },
                                                    columnAligns[j] ? { textAlign: columnAligns[j] } : {},
                                                    { fontFamily: rowFont, fontSize: isSummaryRow ? 9 : 10 }
                                                ]}>{cellText}</Text>
                                            </View>
                                        </View>
                                    );
                                })}
                        </View>
                    );
                })}
            </View>

            <View style={pdfStyles.footer} fixed>
                <Text style={pdfStyles.footerText}>تقرير مالي رسمي - بنظام العائلة المحاسبي</Text>
                <Text style={pdfStyles.footerText} render={({ pageNumber, totalPages }) => (
                    `صفحة ${pageNumber} من ${totalPages}`
                )} />
            </View>
        </Page>
    );

    return (
        <Document title={filename}>
            {sections ? (
                sections.map((s, idx) => renderPage(s.title, s.subtitle, s.headers, s.data, `section-${idx}`))
            ) : (
                data && headers && title && renderPage(title, subtitle, headers, data, 'single-page')
            )}
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

export const exportToPDF = async (
    data: any[],
    filename: string,
    title: string,
    headers: string[],
    keys: string[],
    subtitle?: string,
    summary?: any,
    orientation: 'portrait' | 'landscape' = 'landscape',
    columnStyles: Record<number, string> = {},
    columnFlexes: Record<number, number> = {},
    columnAligns: Record<number, 'left' | 'center' | 'right'> = {},
    sections?: {
        title: string,
        subtitle?: string,
        headers: string[],
        keys: string[],
        data: any[]
    }[]
) => {
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

    const processDataRows = (rows: any[], kList: string[]) => rows.map(item => {
        const rowData: any = kList.map(k => {
            const val = item[k];
            return (typeof val === 'string' && translations[val]) ? translations[val] : val;
        });
        if (item._rowStyle) {
            rowData._rowStyle = item._rowStyle;
        }
        return rowData;
    });

    let pdfSections;
    if (sections) {
        pdfSections = sections.map(s => ({
            title: s.title,
            subtitle: s.subtitle,
            headers: s.headers,
            data: processDataRows(s.data, s.keys)
        }));
    }

    const tableData = processDataRows(data, keys);

    if (summary) {
        const summaryRow = keys.map((k, idx) => {
            if (idx === 0) return 'إجمالي العام';
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
            sections={pdfSections}
            orientation={orientation}
            columnStyles={columnStyles}
            columnFlexes={columnFlexes}
            columnAligns={columnAligns}
            filename={filename}
        />
    ).toBlob();

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename.replace(/\s+/g, '_')}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

import type {ClothingTypeSizeSummary} from "#/clothing/service/clothingOverviewQueries"
import ErrorState from "#/components/base/ErrorState"
import LoadingIndicator from "#/components/base/LoadingIndicator"
import RenderIf from "#/components/base/RenderIf"
import {Badge} from "#/components/ui/badge"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "#/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "#/components/ui/table"

interface ClothingTypeSizeSummaryCardProps {
    summary: ClothingTypeSizeSummary[] | undefined
    isLoading: boolean
    isError: boolean
}

export default function ClothingTypeSizeSummaryCard({
                                                        summary,
                                                        isLoading,
                                                        isError,
                                                    }: ClothingTypeSizeSummaryCardProps) {
    const summaryData = summary ?? []

    return (
        <Card id="clothing-management-content">
            <CardHeader>
                <CardTitle>Bestandsuebersicht nach Groesse</CardTitle>
                <CardDescription>
                    Anzahl der Kleidungsstuecke pro Kleidungstyp und Groesse.
                </CardDescription>
            </CardHeader>

            <CardContent className="space-y-3">
                <RenderIf when={isLoading}>
                    <LoadingIndicator label="Uebersicht wird geladen..."/>
                </RenderIf>

                <RenderIf when={isError}>
                    <ErrorState message="Bestandsuebersicht konnte nicht geladen werden."/>
                </RenderIf>

                <RenderIf when={summaryData.length > 0}>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Kleidungstyp</TableHead>
                                <TableHead>Größe</TableHead>
                                <TableHead>Verfügbarkeit</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {summaryData.map((clothingTypeSummary) => (
                                <TableRow key={clothingTypeSummary.typeId}>
                                    <TableCell colSpan={clothingTypeSummary.sizeGroupSummary.length}
                                               className="font-medium">
                                        {clothingTypeSummary.typeName}
                                    </TableCell>
                                    {clothingTypeSummary.sizeGroupSummary.map(sizeGroup => (
                                        <>
                                            <TableCell>{sizeGroup.name}</TableCell>
                                            <TableCell>
                                                {sizeGroup.sizes.map(sizeSummary =>
                                                    <Badge variant={"outline"}>
                                                        {sizeSummary.size}: {sizeSummary.count}
                                                    </Badge>
                                                )}
                                            </TableCell>
                                        </>

                                    ))}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </RenderIf>

                <RenderIf when={summary !== undefined && summaryData.length === 0}>
                    <p className="text-muted-foreground text-sm">
                        Es sind noch keine Kleidungstypen vorhanden.
                    </p>
                </RenderIf>
            </CardContent>
        </Card>
    )
}

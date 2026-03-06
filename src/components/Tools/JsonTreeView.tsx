import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Hash, Quote, ToggleLeft, CircleDot } from 'lucide-react';

interface JsonTreeViewProps {
    data: any;
    label?: string;
    isLast?: boolean;
    depth?: number;
    searchQuery?: string;
}

const JsonTreeView: React.FC<JsonTreeViewProps> = ({ data, label, isLast = true, depth = 0, searchQuery = '' }) => {
    const getType = (val: any) => {
        if (Array.isArray(val)) return 'array';
        if (val === null) return 'null';
        return typeof val;
    };

    const type = getType(data);
    const isObject = type === 'object' || type === 'array';

    // Helper to check if this node OR any children matches the search query
    const hasMatch = (obj: any, labelStr: string | undefined): boolean => {
        if (!searchQuery) return false;
        const q = searchQuery.toLowerCase();

        // Check label/key
        if (labelStr && labelStr.toLowerCase().includes(q)) return true;

        // Check value if leaf
        if (!isObject) {
            return String(obj).toLowerCase().includes(q);
        }

        // Check children recursively
        if (obj && typeof obj === 'object') {
            return Object.entries(obj).some(([k, v]) => {
                if (labelStr === undefined && Array.isArray(obj)) {
                    // If we are in an array element without label, we just check the value
                    if (typeof v !== 'object' || v === null) {
                        return String(v).toLowerCase().includes(q);
                    }
                    return hasMatch(v, undefined);
                }
                return k.toLowerCase().includes(q) || hasMatch(v, k);
            });
        }
        return false;
    };

    const nodeHasMatch = hasMatch(data, label);
    const [isExpanded, setIsExpanded] = useState(depth < 2 || (!!searchQuery && nodeHasMatch));

    // Force expand if search query changes and there's a match below
    React.useEffect(() => {
        if (searchQuery && nodeHasMatch) {
            setIsExpanded(true);
        }
    }, [searchQuery, nodeHasMatch]);

    const highlightText = (text: string) => {
        if (!searchQuery) return text;
        const parts = text.split(new RegExp(`(${searchQuery})`, 'gi'));
        return (
            <>
                {parts.map((part, i) => (
                    part.toLowerCase() === searchQuery.toLowerCase() ? (
                        <span key={i} className="tree-highlight">{part}</span>
                    ) : (
                        part
                    )
                ))}
            </>
        );
    };

    const toggleExpand = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsExpanded(!isExpanded);
    };

    const renderValue = () => {
        switch (type) {
            case 'string':
                return <span className="tree-val-string">"{highlightText(data)}"</span>;
            case 'number':
                return <span className="tree-val-number">{highlightText(data.toString())}</span>;
            case 'boolean':
                return <span className="tree-val-boolean">{highlightText(data.toString())}</span>;
            case 'null':
                return <span className="tree-val-null">null</span>;
            default:
                return <span>{highlightText(String(data))}</span>;
        }
    };

    const getTypeIcon = () => {
        switch (type) {
            case 'number': return <Hash size={12} />;
            case 'string': return <Quote size={12} />;
            case 'boolean': return <ToggleLeft size={12} />;
            default: return <CircleDot size={12} />;
        }
    };

    const getBracket = (open: boolean) => {
        const b = type === 'array' ? ['[', ']'] : ['{', '}'];
        return open ? b[0] : b[1];
    };

    if (!isObject) {
        return (
            <div className="tree-node leaf" style={{ paddingLeft: `${depth * 20}px` }}>
                <span className="tree-type-icon">{getTypeIcon()}</span>
                {label && <span className="tree-key">{highlightText(label)}: </span>}
                {renderValue()}
                {!isLast && <span className="tree-comma">,</span>}
            </div>
        );
    }

    const keys = Object.keys(data);
    const isEmpty = keys.length === 0;

    return (
        <div className={`tree-node ${isObject ? 'collapsible' : ''}`} style={{ paddingLeft: `${depth * 20}px` }}>
            <div className="tree-line" onClick={toggleExpand}>
                <span className="tree-toggle">
                    {!isEmpty && (isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />)}
                </span>
                {label && <span className="tree-key">{highlightText(label)}: </span>}
                <span className="tree-bracket">{getBracket(true)}</span>
                {!isExpanded && !isEmpty && (
                    <span className="tree-collapsed-info">
                        {type === 'array' ? `${data.length} items` : `${keys.length} keys`}
                    </span>
                )}
                {!isExpanded && <span className="tree-bracket">{getBracket(false)}</span>}
                {!isExpanded && !isLast && <span className="tree-comma">,</span>}
            </div>

            {isExpanded && (
                <div className="tree-children">
                    {keys.map((key, index) => (
                        <JsonTreeView
                            key={key}
                            data={data[key]}
                            label={type === 'array' ? undefined : key}
                            isLast={index === keys.length - 1}
                            depth={depth + 1}
                            searchQuery={searchQuery}
                        />
                    ))}
                </div>
            )}

            {isExpanded && (
                <div className="tree-line-footer">
                    <span className="tree-bracket">{getBracket(false)}</span>
                    {!isLast && <span className="tree-comma">,</span>}
                </div>
            )}
        </div>
    );
};

export default JsonTreeView;

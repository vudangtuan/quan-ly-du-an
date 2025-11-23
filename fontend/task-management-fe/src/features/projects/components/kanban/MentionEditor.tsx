import React, { useRef, useState, useMemo } from 'react';
import Editor from '@draft-js-plugins/editor';
import createMentionPlugin, { defaultSuggestionsFilter } from '@draft-js-plugins/mention';
import { EditorState } from 'draft-js';
import '@draft-js-plugins/mention/lib/plugin.css';

const MentionEditor = ({ members, onSubmit }) => {
    const ref = useRef(null);
    const [editorState, setEditorState] = useState(() => EditorState.createEmpty());
    const [open, setOpen] = useState(false);
    const [suggestions, setSuggestions] = useState(members);

    const { MentionSuggestions, plugins } = useMemo(() => {
        const mentionPlugin = createMentionPlugin();
        const { MentionSuggestions } = mentionPlugin;
        const plugins = [mentionPlugin];
        return { plugins, MentionSuggestions };
    }, []);

    const onSearchChange = ({ value }) => {
        setSuggestions(defaultSuggestionsFilter(value, members));
    };

    return (
        <div className="border rounded-lg p-2">
            <Editor
                editorKey="editor"
                editorState={editorState}
                onChange={setEditorState}
                plugins={plugins}
                ref={ref}
            />
            <MentionSuggestions
                open={open}
                onOpenChange={setOpen}
                suggestions={suggestions}
                onSearchChange={onSearchChange}
            />
        </div>
    );
};
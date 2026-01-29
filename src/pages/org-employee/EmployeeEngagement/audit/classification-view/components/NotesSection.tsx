export default function NotesSection() {
    return (
        <div className="space-y-4">
            <h4 className="font-semibold text-gray-900">Notes (Optional)</h4>
            <textarea
                placeholder="Add any notes or comments about this mapping..."
                className="w-full min-h-[100px] border border-gray-200 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
            />
            <p className="text-xs text-gray-500">
                Add notes to provide context or additional information about this mapping.
            </p>
        </div>
    );
}

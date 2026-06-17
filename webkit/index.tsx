export default async function WebkitMain() {
  // LibraryIQ runs through the Steam client frontend bundle. Keep the webkit
  // entry inert so release builds do not execute template backend callables.
}

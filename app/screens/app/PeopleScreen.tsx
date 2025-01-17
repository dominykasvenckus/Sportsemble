import { UserList } from "@components";
import { useMessageDialogContext } from "@contexts";
import { UserData } from "@types";
import { collection, getDocs } from "firebase/firestore";
import { firestore } from "firebaseConfig";
import { memo, useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  StyleSheet,
  View,
} from "react-native";
import { Searchbar, useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default memo(() => {
  const { top } = useSafeAreaInsets();
  const theme = useTheme();
  const { t } = useTranslation();
  const { showDialog } = useMessageDialogContext();

  const [users, setUsers] = useState<UserData[] | null>(null);
  const [filteredUsers, setFilteredUsers] = useState<UserData[] | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const fetchUsersData = useCallback(async () => {
    try {
      const querySnapshot = await getDocs(collection(firestore, "users"));
      const users = querySnapshot.docs.map(
        (doc) => ({ userId: doc.id, ...doc.data() }) as UserData,
      );
      setUsers(users);
      setIsLoading(false);
    } catch {
      showDialog(t("errors.generic"));
      setIsLoading(false);
    }
  }, [showDialog, t]);

  useEffect(() => {
    (async () => {
      await fetchUsersData();
    })();
  }, [fetchUsersData]);

  useEffect(() => {
    if (!users) {
      return;
    }

    if (!searchQuery) {
      setFilteredUsers(null);
      return;
    }

    const transformedSearchQuery = searchQuery.toLowerCase().replace(/\s/g, "");
    const filteredUsers = users.filter((user) =>
      user.fullName
        .toLowerCase()
        .replace(/\s/g, "")
        .includes(transformedSearchQuery),
    );
    setFilteredUsers(filteredUsers);
  }, [users, searchQuery]);

  const handleSearchQueryChange = useCallback((text: string) => {
    setSearchQuery(text);
  }, []);

  return (
    <KeyboardAvoidingView style={[styles.container, { paddingTop: top }]}>
      {!isLoading ? (
        <>
          <Searchbar
            placeholder={t("placeholders.search")}
            style={styles.searchBar}
            inputStyle={styles.searchBarInput}
            rippleColor="transparent"
            autoCorrect={false}
            value={searchQuery}
            onChangeText={handleSearchQueryChange}
          />
          {filteredUsers && (
            <UserList
              emptyListTextContainerStyle={styles.emptyListTextContainer}
              data={filteredUsers}
              onRefresh={fetchUsersData}
            />
          )}
        </>
      ) : (
        <View style={styles.activityIndicatorContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      )}
    </KeyboardAvoidingView>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchBar: {
    margin: 15,
    backgroundColor: "#ececec",
  },
  searchBarInput: {
    color: "#000000",
  },
  emptyListTextContainer: {
    justifyContent: "flex-start",
  },
  activityIndicatorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
